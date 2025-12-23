import { memo } from "react";
import type { CSSProperties } from "react";

type AvatarDotProps = {
  x: number;
  y: number;
  color: string;
  name: string;
  isSelf: boolean;
  isHovered: boolean;
  status?: string;
  onHoverChange?: (hovered: boolean) => void;
};

function AvatarDotComponent({
  x,
  y,
  color,
  name,
  isSelf,
  isHovered,
  status,
  onHoverChange,
}: AvatarDotProps) {
  const label = status ? `${name} - ${status}` : name;
  const containerStyle: CSSProperties = {
    left: `${x}px`,
    top: `${y}px`,
  };

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      style={containerStyle}
      aria-label={label}
      title={label}
      tabIndex={0}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
    >
      <div className="relative flex items-center justify-center">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        {isSelf && (
          <span
            className="absolute h-6 w-6 rounded-full border border-white/40"
            aria-hidden="true"
          />
        )}
      </div>
      {isHovered && (
        <div className="pointer-events-none absolute left-1/2 top-full mt-2 w-max max-w-[200px] -translate-x-1/2 rounded-full bg-[rgba(15,23,42,0.9)] px-2.5 py-1 text-center text-[0.7rem] font-medium text-slate-50 shadow-[0_12px_24px_rgba(10,18,35,0.45)]">
          <div className="font-semibold">{name}</div>
          {status && <div className="text-xs text-slate-300/80">{status}</div>}
        </div>
      )}
    </div>
  );
}

export const AvatarDot = memo(AvatarDotComponent);
