import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type CompanionState = "idle" | "shared" | "break" | "complete";

type AvatarSpriteProps = {
  x: number;
  y: number;
  color: string;
  name: string;
  isSelf: boolean;
  isHovered: boolean;
  status?: string;
  onHoverChange?: (hovered: boolean) => void;
  spiritState?: CompanionState;
};

type PaletteSet = {
  base: string;
  highlight: string;
  mid: string;
  lowerMid: string;
  shadow: string;
  aura: string;
  outlineTop: string;
  outlineBottom: string;
  scarfTop: string;
  scarfBottom: string;
  scarfHighlight: string;
  scarfShadow: string;
  scarfTail: string;
  eye: string;
  eyeHighlight: string;
  mouth: string;
  blush: string;
};

type StateConfig = {
  floatDistance: number;
  floatDuration: number;
  flickerDuration: number;
  flickerMin: number;
  flickerMax: number;
  brightness: number;
  palette: PaletteSet;
  pulse?: boolean;
};

const CANVAS_SIZE = 32;
const DISPLAY_SCALE = 3.2;
const DISPLAY_SIZE = CANVAS_SIZE * DISPLAY_SCALE;

const SHADOW_COLOR = "rgba(120, 78, 36, 0.2)";
const FRAME_SEQUENCE = [0, 1, 2];
const FRAME_DURATION_MS = 320;
const BLINK_INTERVAL_MS = 8000;
const BLINK_FRAME_MS = 140;

const FRAME_SETTINGS = [
  { offsetY: -1 },
  { offsetY: 0 },
  { offsetY: 1 },
] as const;

const SYNC_ANCHOR =
  typeof performance !== "undefined" ? performance.now() : Date.now();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const intVal = parseInt(normalized, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

function rgbaHex(hex: string, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return { r, g, b, a: Math.round(alpha * 255) };
}

function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function buildPalette(): PaletteSet {
  return {
    base: "#F8DCA4",
    highlight: "#FFF2D0",
    mid: "#F8DCA4",
    lowerMid: "#E7C28C",
    shadow: "#C1A06E",
    aura: "#F2D5A0",
    outlineTop: "#DDB98B",
    outlineBottom: "#A07C58",
    scarfTop: "#F3D5B4",
    scarfBottom: "#C0A9B6",
    scarfHighlight: "#F9E5C8",
    scarfShadow: "#A68FAF",
    scarfTail: "#A67E8C",
    eye: "#1F1528", // Deepened eye color
    eyeHighlight: "#E8DFF7",
    mouth: "#D6A3A0",
    blush: "#D9A9C9",
  };
}

const PALETTE = buildPalette();

const STATE_CONFIG: Record<CompanionState, StateConfig> = {
  idle: {
    floatDistance: 2,
    floatDuration: 5,
    flickerDuration: 3.4,
    flickerMin: 0.98,
    flickerMax: 1,
    brightness: 0.95,
    palette: PALETTE,
  },
  shared: {
    floatDistance: 2.1,
    floatDuration: 4.6,
    flickerDuration: 2.8,
    flickerMin: 0.99,
    flickerMax: 1.02,
    brightness: 1,
    palette: PALETTE,
  },
  break: {
    floatDistance: 1.8,
    floatDuration: 5.2,
    flickerDuration: 3.6,
    flickerMin: 0.97,
    flickerMax: 0.99,
    brightness: 0.9,
    palette: PALETTE,
  },
  complete: {
    floatDistance: 2.4,
    floatDuration: 4,
    flickerDuration: 2.3,
    flickerMin: 0.99,
    flickerMax: 1.04,
    brightness: 1.05,
    palette: PALETTE,
    pulse: true,
  },
};

function setPixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  color: { r: number; g: number; b: number; a?: number }
) {
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return;
  const idx = (y * CANVAS_SIZE + x) * 4;
  data[idx] = color.r;
  data[idx + 1] = color.g;
  data[idx + 2] = color.b;
  data[idx + 3] = color.a ?? 255;
}

function blendPixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
  alpha: number
) {
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return;
  const idx = (y * CANVAS_SIZE + x) * 4;
  const inv = 1 - alpha;
  data[idx] = Math.round(data[idx] * inv + color.r * alpha);
  data[idx + 1] = Math.round(data[idx + 1] * inv + color.g * alpha);
  data[idx + 2] = Math.round(data[idx + 2] * inv + color.b * alpha);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  blink: boolean,
  palette: PaletteSet
) {
  const { offsetY } = FRAME_SETTINGS[frameIndex];
  const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const data = imageData.data;

  const centerX = 16;
  const centerY = 16 + offsetY;
  const bodyRadius = 9.5;

  const highlightRGB = hexToRgb(palette.highlight);
  const midRGB = hexToRgb(palette.mid);
  const lowerMidRGB = hexToRgb(palette.lowerMid);
  const shadowRGB = hexToRgb(palette.shadow);
  const outlineTop = rgbaHex(palette.outlineTop, 0.42);
  const outlineBottom = rgbaHex(palette.outlineBottom, 0.95);
  const deepOutlineRGB = hexToRgb("#8C6A3C");
  const deepOutline = { ...deepOutlineRGB, a: 240 };
  const auraRGBA = rgbaHex(palette.aura, 0.4);
  const warmGlowRGB = hexToRgb("#F3C8A5");
  // Honey-rose for lower-left shading warmth
  const honeyRoseRGB = hexToRgb("#D4A574");

  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const normalizedY = dy / bodyRadius;

      const topAdjust =
        normalizedY < -0.2
          ? Math.abs(dx) <= 1
            ? -0.4
            : Math.abs(dx) === 2
            ? -0.2
            : 0
          : 0;
      const bottomAdjust =
        normalizedY > 0.45
          ? Math.abs(dx) <= 1
            ? 0.6
            : Math.abs(dx) <= 3
            ? 0.2
            : -0.3
          : 0;
      const sideRound =
        Math.abs(dx) >= 5 && Math.abs(dx) <= 6 && normalizedY > -0.1 && normalizedY < 0.4
          ? 0.3
          : 0;
      const bellyLift =
        normalizedY > 0.15
          ? normalizedY > 0.45
            ? 1
            : 0.6
          : 0;

      const effectiveRadius =
        bodyRadius -
        (normalizedY < 0 ? Math.abs(normalizedY) * 4 + topAdjust : 0) +
        bottomAdjust +
        sideRound +
        bellyLift;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > effectiveRadius && distance <= effectiveRadius + 3) {
        const clampedY = Math.max(-0.6, Math.min(0.6, normalizedY));
        const verticalFalloff = 0.55 + (Math.cos((clampedY + 0.6) * Math.PI) + 1) * 0.2;
        const auraPixel = {
          ...auraRGBA,
          a: Math.round(auraRGBA.a * verticalFalloff * 0.8),
        };
        if (auraPixel.a > 10) {
          setPixel(data, x, y, auraPixel);
        }
        continue;
      }

      if (distance <= effectiveRadius) {
        const outlineColor = normalizedY < 0 ? outlineTop : outlineBottom;
        if (distance >= effectiveRadius - 0.8) {
          const edgeColor = normalizedY > 0.28 ? deepOutline : outlineColor;
          setPixel(data, x, y, edgeColor);
        } else {
          let targetRGB = midRGB;
          if (normalizedY < -0.2) {
            const t = clamp((-0.2 - normalizedY) / 0.4, 0, 1);
            targetRGB = mixColor(highlightRGB, midRGB, t);
          } else if (normalizedY < 0.2) {
            const t = clamp((normalizedY + 0.2) / 0.4, 0, 1);
            targetRGB = mixColor(midRGB, lowerMidRGB, t);
          } else {
            const t = clamp((normalizedY - 0.2) / 0.5, 0, 1);
            targetRGB = mixColor(lowerMidRGB, shadowRGB, t);
          }
          if (dx <= -2 && normalizedY < 0.15) {
            targetRGB = mixColor(targetRGB, highlightRGB, 0.35);
          }
          if (dx <= -3 && normalizedY < -0.05) {
            targetRGB = mixColor(targetRGB, highlightRGB, 0.25);
          }
          if (normalizedY < -0.3) {
            targetRGB = mixColor(targetRGB, highlightRGB, 0.2);
          }
          // Warm lower-left toward honey-rose
          if (dx <= -2 && normalizedY > 0.2) {
            targetRGB = mixColor(targetRGB, honeyRoseRGB, 0.3);
          }
          // Lighten lower-right edge
          if (dx >= 2 && normalizedY > 0.1) {
            targetRGB = mixColor(targetRGB, highlightRGB, 0.28);
          }
          if (dx >= 3 && normalizedY > 0.25) {
            targetRGB = mixColor(targetRGB, highlightRGB, 0.2);
          }
          if (normalizedY > 0.35) {
            targetRGB = mixColor(targetRGB, warmGlowRGB, 0.35);
            if (normalizedY > 0.45) {
              targetRGB = mixColor(targetRGB, warmGlowRGB, 0.45);
            }
          }
          setPixel(data, x, y, { ...targetRGB, a: 255 });
          if (normalizedY > 0.3 && distance >= effectiveRadius - 1.1) {
            blendPixel(data, x, y, deepOutlineRGB, 0.45);
          }
        }
      }
    }
  }

  const glowRadius = 8;
  const innerGlowRGB = hexToRgb("#FFE8BF");
  // Looser dither pattern for misty fade
  for (let oy = -glowRadius; oy <= glowRadius; oy++) {
    for (let ox = -glowRadius; ox <= glowRadius; ox++) {
      const distance = Math.sqrt(ox * ox + oy * oy);
      if (distance <= glowRadius) {
        // Looser dither: more variation for misty fade
        const dither = ((ox + oy + (ox * 2)) & 3) ? 0.6 : 0.85;
        const alpha = 0.28 * (1 - distance / glowRadius) * dither;
        blendPixel(data, centerX + ox, centerY + oy, innerGlowRGB, alpha);
      }
    }
  }

  const midPixel = { ...midRGB, a: 255 };
  const auraPixel = { ...auraRGBA };
  const domeHighlight = mixColor(midRGB, highlightRGB, 0.4);

  // Halo crescent: dim desaturated glow at top
  const haloColor = hexToRgb("#FFF9E6"); // Desaturated warm glow
  blendPixel(data, 15, 1, haloColor, 0.18); // Top center of crescent
  blendPixel(data, 14, 2, haloColor, 0.22); // Left crescent point
  
  // Top edge adjustments
  blendPixel(data, 15, 2, domeHighlight, 0.25);

  // Upper side curvature

  // Lower side rounding
  setPixel(data, 9, 15, midPixel);
  setPixel(data, 22, 15, midPixel);

  // Bottom curve smoothing - keep row 20 warm and add pixel at (16,21)
  setPixel(data, 14, 21, midRGB);
  setPixel(data, 16, 21, midRGB); // Extra pixel for smoothness
  setPixel(data, 17, 21, midRGB);
  blendPixel(data, 14, 20, midRGB, 0.3);
  blendPixel(data, 15, 20, warmGlowRGB, 0.25); // Warm row 20
  blendPixel(data, 16, 20, warmGlowRGB, 0.25);
  blendPixel(data, 17, 20, midRGB, 0.3);
  
  // Remove bottom shadow at (15,22) - lighten if it exists
  if (15 >= 0 && 15 < CANVAS_SIZE && 22 >= 0 && 22 < CANVAS_SIZE) {
    // Lighten the pixel to remove shadow effect
    blendPixel(data, 15, 22, midRGB, 0.5);
  }

  const mouthColor = hexToRgb(palette.mouth);
  const blushRGB = hexToRgb(palette.blush);
  const eyeColor = rgbaHex(palette.eye);
  const eyeHighlight = hexToRgb(palette.eyeHighlight);

  // Enhance cheeks with gentle saturation - current positions and also at (10,12) and (21,12) if they exist
  blendPixel(data, centerX - 5, centerY + 3, blushRGB, 0.35); // Enhanced saturation
  blendPixel(data, centerX - 4, centerY + 3, blushRGB, 0.35);
  blendPixel(data, centerX + 4, centerY + 3, blushRGB, 0.35);
  blendPixel(data, centerX + 5, centerY + 3, blushRGB, 0.35);
  // Additional cheek enhancement at absolute coordinates if they fall within canvas
  if (10 >= 0 && 10 < CANVAS_SIZE && 12 >= 0 && 12 < CANVAS_SIZE) {
    blendPixel(data, 10, 12, blushRGB, 0.28);
  }
  if (21 >= 0 && 21 < CANVAS_SIZE && 12 >= 0 && 12 < CANVAS_SIZE) {
    blendPixel(data, 21, 12, blushRGB, 0.28);
  }

  const eyeRow = 16 + offsetY;
  const eyeColumns = [13, 18];
  eyeColumns.forEach((x) => {
    setPixel(data, x, eyeRow, eyeColor);
    setPixel(data, x, eyeRow + 1, eyeColor);
  });

  if (blink) {
    eyeColumns.forEach((x) => {
      setPixel(data, x, eyeRow, outlineBottom);
      setPixel(data, x, eyeRow + 1, outlineBottom);
    });
  }

  // Mouth: raised one pixel upward for softer expression
  const mouthRow = centerY + 4; // Raised from centerY + 5
  const mouthCenterX = centerX;
  blendPixel(data, mouthCenterX - 1, mouthRow, mouthColor, 0.6);
  blendPixel(data, mouthCenterX, mouthRow, mouthColor, 0.7);
  blendPixel(data, mouthCenterX + 1, mouthRow, mouthColor, 0.6);

  ctx.putImageData(imageData, 0, 0);
}

function AvatarSpriteComponent({
  x,
  y,
  color,
  name,
  isSelf,
  isHovered,
  onHoverChange,
  spiritState = "idle",
}: AvatarSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelId = useMemo(() => `${name.replace(/\s+/g, "-")}-label`, [name]);
  const stateConfig = STATE_CONFIG[spiritState];
  const [frameIndex, setFrameIndex] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawFrame(ctx, FRAME_SEQUENCE[frameIndex], blink, stateConfig.palette);
  }, [frameIndex, blink, stateConfig.palette]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAME_SEQUENCE.length);
    }, FRAME_DURATION_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setBlink(true);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setBlink(false);
      }, BLINK_FRAME_MS);
    }, BLINK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const elapsedSeconds = (now - SYNC_ANCHOR) / 1000;
  const floatPhase = elapsedSeconds % stateConfig.floatDuration;
  const flickerPhase = elapsedSeconds % stateConfig.flickerDuration;

  const containerStyle: CSSProperties = {
    left: `${x}px`,
    top: `${y}px`,
    filter: `brightness(${stateConfig.brightness})`,
  };
  (containerStyle as any)["--float-distance"] = `${stateConfig.floatDistance}px`;
  (containerStyle as any)["--float-duration"] = `${stateConfig.floatDuration}s`;
  (containerStyle as any)["--float-delay"] = `${-floatPhase}s`;
  (containerStyle as any)["--flicker-duration"] = `${stateConfig.flickerDuration}s`;
  (containerStyle as any)["--flicker-delay"] = `${-flickerPhase}s`;
  (containerStyle as any)["--flicker-min"] = stateConfig.flickerMin;
  (containerStyle as any)["--flicker-max"] = stateConfig.flickerMax;

  return (
    <div
      className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 transform transition duration-200 hover:scale-[1.05] focus-visible:scale-[1.05] focus-visible:outline-none"
      style={containerStyle}
      aria-labelledby={labelId}
      data-testid={isSelf ? "avatar-self" : "avatar-remote"}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      tabIndex={0}
    >
      <div
        className={`focus-spirit__motion${
          stateConfig.pulse ? " focus-spirit__motion--pulse" : ""
        }`}
      >
        <span
          className="focus-spirit__glow"
          style={{
            backgroundColor: rgbaString(stateConfig.palette.aura, 0.12),
            boxShadow: `0 0 16px ${rgbaString(stateConfig.palette.aura, 0.4)}`,
          }}
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            width: DISPLAY_SIZE,
            height: DISPLAY_SIZE,
            imageRendering: "pixelated",
          }}
          className={`focus-spirit__canvas${
            stateConfig.pulse ? " focus-spirit__canvas--pulse" : ""
          }`}
          aria-hidden="true"
        />
      </div>
      <span className="focus-spirit__shadow" aria-hidden="true" />
      <div
        id={labelId}
        className={`pointer-events-none absolute top-full mt-2 left-1/2 w-max max-w-[200px] -translate-x-1/2 rounded-full bg-[rgba(15,23,42,0.9)] px-2.5 py-1 text-center text-[0.72rem] font-medium text-slate-50 shadow-[0_12px_24px_rgba(10,18,35,0.45)] transition duration-200 ${
          isHovered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="font-semibold">{name}</div>
        {status && <div className="text-xs text-slate-300/80">{status}</div>}
      </div>
      <style jsx>{`
        .focus-spirit__motion {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: focusSpiritFloat var(--float-duration, 5s)
              ease-in-out var(--float-delay, 0s) infinite;
        }

        .focus-spirit__motion--pulse {
          animation: focusSpiritFloat var(--float-duration, 5s)
              ease-in-out var(--float-delay, 0s) infinite,
            focusSpiritPulse 1.4s ease-out forwards;
        }

        .focus-spirit__canvas {
          position: relative;
          z-index: 1;
          animation: focusSpiritFlicker var(--flicker-duration, 3.4s)
              ease-in-out var(--flicker-delay, 0s) infinite;
        }

        .focus-spirit__canvas--pulse {
          animation: focusSpiritFlicker var(--flicker-duration, 3.4s)
              ease-in-out var(--flicker-delay, 0s) infinite,
            focusSpiritCanvasPulse 1.4s ease-out forwards;
        }

        .focus-spirit__shadow {
          display: block;
          width: 34px;
          height: 3px;
          margin: 6px auto 0;
          border-radius: 9999px;
          background: ${SHADOW_COLOR};
        }

        @keyframes focusSpiritFloat {
          0%,
          100% {
            transform: translateY(calc(var(--float-distance, 2px) * -1));
          }
          50% {
            transform: translateY(var(--float-distance, 2px));
          }
        }

        @keyframes focusSpiritFlicker {
          0%,
          100% {
            opacity: var(--flicker-max, 1);
          }
          60% {
            opacity: var(--flicker-min, 0.98);
          }
        }

        @keyframes focusSpiritPulse {
          0% {
            filter: brightness(1);
          }
          40% {
            filter: brightness(1.2);
          }
          100% {
            filter: brightness(1);
          }
        }

        @keyframes focusSpiritCanvasPulse {
          0% {
            opacity: 1;
          }
          35% {
            opacity: 1;
          }
          50% {
            opacity: 0.92;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export const AvatarSprite = memo(AvatarSpriteComponent);
