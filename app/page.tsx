"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Moon } from "lucide-react";
import { motion } from "framer-motion";

import { usePresenceManager } from "@/components/lounge/usePresenceManager";
import { useTimerSync } from "@/components/lounge/useTimerSync";
import { AmbientPlayer, AmbientPlayerHandle } from "@/components/AmbientPlayer";
import { AvatarDrawer } from "@/components/AvatarDrawer";
import { AvatarSprite } from "@/components/AvatarSprite";
import { CornerstoneMenu } from "@/components/CornerstoneMenu";
import AuthModal from "@/components/AuthModal";
import { PomodoroPanel } from "@/components/PomodoroPanel";
import { SharedAura } from "@/components/SharedAura";
import { Toast } from "@/components/Toast";
import { UnifiedWelcomeModal } from "@/components/UnifiedWelcomeModal";
import type { Identity, TimerState } from "@/lib/types";
import { approach, clampNormalized, lerp, pickAvatarColor } from "@/lib/utils";
import { useUIStore } from "@/lib/state/uiStore";
import styles from './Home.module.css';
import { useIdentityManager } from "@/components/lounge/useIdentityManager";
import { identifyUser } from "@/lib/analytics/posthogClient";
import { events } from "@/lib/analytics/events";

export default function HomePage() {
  const {
    identity,
    user,
    showWelcome,
    setShowWelcome,
    handleWelcomeConfirm: confirmIdentity,
    handleContinueAsGuest: continueAsGuest,
    displayName,
    syncIdentityColor,
  } = useIdentityManager();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetPositionRef = useRef({ x: 0.5, y: 0.68 });
  
  const [isCornerstoneMenuOpen, setIsCornerstoneMenuOpen] = useState(false);
  const [isAvatarDrawerOpen, setIsAvatarDrawerOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isStatusShared, setIsStatusShared] = useState(false);

  const [toast, setToast] = useState<{ message: string, color?: string, visible: boolean }>({ message: '', visible: false });

  const {
    avatarColor,
    setAvatarColor,
    ambientVolume,
    setAmbientVolume,
    focusSessionMinutes,
    setFocusSessionMinutes,
    breakSessionMinutes,
    setBreakSessionMinutes,
    isAuthModalOpen,
    toggleAuthModal,
  } = useUIStore(
    useShallow((state) => ({
      avatarColor: state.avatarColor,
      setAvatarColor: state.setAvatarColor,
      ambientVolume: state.ambientVolume,
      setAmbientVolume: state.setAmbientVolume,
      focusSessionMinutes: state.focusSessionMinutes,
      setFocusSessionMinutes: state.setFocusSessionMinutes,
      breakSessionMinutes: state.breakSessionMinutes,
      setBreakSessionMinutes: state.setBreakSessionMinutes,
      isAuthModalOpen: state.isAuthModalOpen,
      toggleAuthModal: state.toggleAuthModal,
    }))
  );

  const handleToast = useCallback((message: string, color?: string) => {
    setToast({ message, color, visible: true });
  }, []);

  const { avatars, onlineCount, handleHoverChange, connectionStatus } = usePresenceManager({
    identity,
    showWelcome,
    isStatusShared,
    status,
    containerRef,
    targetPositionRef,
    onToast: handleToast,
  });
  
  const syncingColorRef = useRef(false);

  const focusDurationMs = focusSessionMinutes * 60 * 1000;
  const breakDurationMs = breakSessionMinutes * 60 * 1000;

  const ambientPlayerRef = useRef<AmbientPlayerHandle | null>(null);

  const {
    timerState,
    handleToggleMode,
    handleStartStop,
    handleResetTimer,
    handleSkipPhase,
  } = useTimerSync({
    identity,
    showWelcome,
    focusDurationMs,
    breakDurationMs,
  });

  const ensureAmbientPlayback = useCallback(() => {
    void ambientPlayerRef.current?.ensurePlayback();
  }, []);

  const handleStartStopWithSound = useCallback(() => {
    const starting = !timerState.isRunning;
    if (starting) {
      events.timerStart({ mode: timerState.mode, phase: timerState.phase });
    } else {
      events.timerPause({ mode: timerState.mode, phase: timerState.phase });
    }
    ensureAmbientPlayback();
    handleStartStop();
  }, [ensureAmbientPlayback, handleStartStop, timerState.isRunning, timerState.mode, timerState.phase]);

  const handleToggleModeWithTracking = useCallback(() => {
    events.timerModeToggle({
      nextMode: timerState.mode === "solo" ? "shared" : "solo",
    });
    handleToggleMode();
  }, [handleToggleMode, timerState.mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const body = document.body;
    body.dataset.theme = "twilight"; 

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      body.dataset.motion = reducedMotionQuery.matches ? "reduced" : "full";
    };
    updateReducedMotion();
    reducedMotionQuery.addEventListener("change", updateReducedMotion);

    const contrastQuery = window.matchMedia("(prefers-contrast: more)");
    const updateContrast = () => {
      body.dataset.contrast = contrastQuery.matches ? "high" : "normal";
    };
    updateContrast();
    contrastQuery.addEventListener("change", updateContrast);

    return () => {
      reducedMotionQuery.removeEventListener("change", updateReducedMotion);
      contrastQuery.removeEventListener("change", updateContrast);
    };
  }, []);

  useEffect(() => {
    if (!identity) return;
    identifyUser({ id: identity.guestId, kind: user ? "user" : "guest" });
  }, [identity?.guestId, user]);

  const hasSyncedIdentityColorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!identity?.color || !identity.guestId) return;
    if (hasSyncedIdentityColorRef.current === identity.guestId) return;
    if (identity.color.toLowerCase() !== avatarColor.toLowerCase()) {
      setAvatarColor(identity.color);
    }
    hasSyncedIdentityColorRef.current = identity.guestId;
  }, [identity?.guestId, setAvatarColor]);

  useEffect(() => {
    if (!identity || syncingColorRef.current) return;
    if (identity.color.toLowerCase() === avatarColor.toLowerCase()) {
      return;
    }
    syncingColorRef.current = true;
    syncIdentityColor(avatarColor);
    syncingColorRef.current = false;
  }, [avatarColor, syncIdentityColor]);

  const setTargetFromPoint = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    targetPositionRef.current = {
      x: clampNormalized((clientX - rect.left) / rect.width),
      y: clampNormalized((clientY - rect.top) / rect.height),
    };
  }, []);

  const handleScenePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      ensureAmbientPlayback();
      setTargetFromPoint(event.clientX, event.clientY);
    },
    [ensureAmbientPlayback, setTargetFromPoint]
  );

  const handleScenePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.buttons & 1) === 1 || event.pointerType === "touch") {
        setTargetFromPoint(event.clientX, event.clientY);
      }
    },
    [setTargetFromPoint]
  );
  
  const sharedActive = timerState.mode === "shared" && !showWelcome;
  const sharedParticipants = useMemo(
    () => avatars.filter((avatar) => !avatar.isSelf),
    [avatars]
  );
  const participants = useMemo(() => {
    const isSharedFocus =
      timerState.isRunning && timerState.phase === "focus" && sharedActive;
    const isSoloFocus =
      timerState.isRunning && timerState.phase === "focus" && !sharedActive;
    return avatars.map((avatar) => ({
      id: avatar.id,
      name: avatar.name,
      color: avatar.color,
      isSelf: avatar.isSelf,
      isFocusing: isSharedFocus || (isSoloFocus && avatar.isSelf),
    }));
  }, [avatars, sharedActive, timerState]);

  const handleWelcomeConfirm = useCallback(
    ({ displayName, color }: { displayName: string; color: string }) => {
      confirmIdentity({ displayName, color });
      setShowWelcome(false);
    },
    [confirmIdentity, setShowWelcome]
  );

  const handleAuthSuccess = () => {
    toggleAuthModal(false);
    // onAuthStateChange will handle updating the user and identity state.
  };

  const handleContinueAsGuest = () => {
    toggleAuthModal(false);
    continueAsGuest();
  };

  const connectionLabel = useMemo(() => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting…";
      case "error":
        return "Reconnecting…";
      default:
        return "Idle";
    }
  }, [connectionStatus]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-twilight text-slate-100">
      <div className="fixed left-4 top-4 z-30 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-parchment shadow-glass-sm backdrop-blur">
        Presence: {connectionLabel}
      </div>
      <div
        ref={containerRef}
        className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center transition duration-500 ${
          showWelcome || isAuthModalOpen ? "pointer-events-none scale-[0.98] blur-[1.5px]" : ""
        }`}
        style={{ backgroundImage: "url('/lofi.gif')" }}
        onPointerDown={handleScenePointerDown}
        onPointerMove={handleScenePointerMove}
        onPointerUp={handleScenePointerDown}
        role="application"
        aria-label="StudyHarbor shared space. Click to move your avatar."
        aria-hidden={showWelcome || isAuthModalOpen}
>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.85)_0%,rgba(15,23,42,0.55)_35%,rgba(15,23,42,0.85)_100%)] mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 -m-[30%] animate-aurora-drift bg-[radial-gradient(circle_at_22%_25%,rgba(251,191,36,0.14),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(96,165,250,0.2),transparent_55%),radial-gradient(circle_at_50%_75%,rgba(248,113,113,0.18),transparent_50%)] blur-[40px] opacity-85" />

        <div className="pointer-events-none absolute left-[18%] top-[12%] h-64 w-64 rounded-full bg-[#fcd34d1a] blur-3xl" />
        <div className="pointer-events-none absolute right-[12%] top-[28%] h-72 w-72 rounded-full bg-[#38bdf81a] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[18%] left-[30%] h-80 w-80 rounded-full bg-[#f973af1a] blur-3xl" />

        <div className={`absolute inset-0 transition-opacity duration-500 opacity-100`}>

        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="absolute bottom-8 right-8 flex items-center gap-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setIsCornerstoneMenuOpen(true)}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-100 shadow-glass-sm transition duration-150 hover:border-white/25 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Open menu"
          >
            <Moon className="h-5 w-5 transition duration-150 group-hover:text-[#E8C877]" />
          </button>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" onPointerDown={(e) => e.stopPropagation()}>
          <AmbientPlayer
            ref={ambientPlayerRef}
            src="/lofi.mp3"
            songName="Lofi Study Beats"
          />
        </div>

        <SharedAura active={sharedActive} participants={avatars} />

        <div className="pointer-events-none absolute inset-0">
          {avatars.map((avatar) => (
            <AvatarSprite
              key={avatar.id}
              x={avatar.x}
              y={avatar.y}
              color={avatar.color}
              name={avatar.name}
              isSelf={avatar.isSelf}
              isHovered={!!avatar.isHovered}
              status={avatar.status}
              onHoverChange={(hovering) =>
                handleHoverChange(avatar.id, hovering)
              }
            />
          ))}
        </div>

        {/* Timer - top right */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="absolute top-8 right-8 w-full max-w-xs" 
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PomodoroPanel
            mode={timerState.mode}
            phase={timerState.phase}
            remainingMs={timerState.remainingMs}
            focusDurationMs={focusDurationMs}
            breakDurationMs={breakDurationMs}
            isRunning={timerState.isRunning}
            onToggleMode={handleToggleModeWithTracking}
            onStartStop={handleStartStopWithSound}
            onReset={handleResetTimer}
            onSkipPhase={handleSkipPhase}
            sharedActive={sharedActive}
            companionCount={onlineCount}
            sharedParticipants={sharedParticipants.map(({ id, color }) => ({ id, color }))}
            focusSessionMinutes={focusSessionMinutes}
            onFocusSessionChange={setFocusSessionMinutes}
            breakSessionMinutes={breakSessionMinutes}
            onBreakSessionChange={setBreakSessionMinutes}
            status={status}
            onStatusChange={setStatus}
            isStatusShared={isStatusShared}
            onIsStatusSharedChange={setIsStatusShared}
          />
        </motion.div>
        </div>
      </div>
      <CornerstoneMenu
        open={isCornerstoneMenuOpen}
        onClose={() => setIsCornerstoneMenuOpen(false)}
        user={user}
        toggleAuthModal={toggleAuthModal}
        subscriptionStatus={identity?.subscription_status ?? 'free'}
        ambientVolume={ambientVolume}
        onAmbientVolumeChange={setAmbientVolume}
        focusSessionMinutes={focusSessionMinutes}
        onFocusSessionChange={setFocusSessionMinutes}
        breakSessionMinutes={breakSessionMinutes}
        onBreakSessionChange={setBreakSessionMinutes}
        participants={participants}
        onlineCount={onlineCount}
        displayName={displayName}
        initialName={identity?.displayName ?? ""}
        initialColor={identity?.color ?? "#FDE68A"}
        onConfirm={handleWelcomeConfirm}
      />
      <AvatarDrawer
        open={isAvatarDrawerOpen}
        onClose={() => setIsAvatarDrawerOpen(false)}
        initialColor={avatarColor}
        onSave={(hex) => setAvatarColor(hex)}
        onRandomize={() => pickAvatarColor()}
      />
      {identity && (
        <UnifiedWelcomeModal
          open={showWelcome}
          initialName={identity.displayName}
          initialColor={identity.color}
          onConfirm={handleWelcomeConfirm}
        />
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => toggleAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />
      <Toast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
        color={toast.color}
        duration={3000}
      />
    </main>
  );
}
