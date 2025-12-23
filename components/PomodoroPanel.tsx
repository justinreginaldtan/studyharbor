import { useMemo, useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Users,
  User,
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PomodoroPanelProps = {
  mode: "solo" | "shared";
  phase: "focus" | "break";
  remainingMs: number;
  focusDurationMs: number;
  breakDurationMs: number;
  isRunning: boolean;
  onToggleMode: () => void;
  onStartStop: () => void;
  onReset: () => void;
  onSkipPhase: () => void;
  sharedActive?: boolean;
  companionCount?: number;
  sharedParticipants?: { id: string; color: string }[];
  // New props for settings
  focusSessionMinutes: number;
  onFocusSessionChange: (minutes: number) => void;
  breakSessionMinutes: number;
  onBreakSessionChange: (minutes: number) => void;
  // New props for status
  status: string;
  onStatusChange: (status: string) => void;
  isStatusShared: boolean;
  onIsStatusSharedChange: (isShared: boolean) => void;
  // Focus saver mode
  lowPower?: boolean;
};

const PHASE_LABEL = {
  focus: "Focus",
  break: "Breathe",
} as const;

export function PomodoroPanel(props: PomodoroPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const companionCount = props.companionCount ?? 1;

  const totalDurationMs =
    props.phase === "focus" ? props.focusDurationMs : props.breakDurationMs;
  const clampedRemaining = Math.max(0, Math.min(props.remainingMs, totalDurationMs));

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.ceil(clampedRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [clampedRemaining]);

  const hint = useMemo(() => {
    if (props.mode !== "shared") {
      return props.isRunning ? "Focusing." : "Ready to focus?";
    }
    if (companionCount > 1) {
      const others = companionCount - 1;
      return others === 1
        ? "With one companion."
        : `With ${others} companions.`;
    }
    return props.isRunning ? "Focusing together." : "Ready to join?";
  }, [props.mode, props.isRunning, companionCount]);

  const handleTimeChange = (amount: number) => {
    if (props.phase === 'focus') {
      props.onFocusSessionChange(Math.max(5, props.focusSessionMinutes + amount));
    } else {
      props.onBreakSessionChange(Math.max(1, props.breakSessionMinutes + amount));
    }
  };

  // In low power mode: click to toggle. In normal mode: hover to show.
  const handleMouseEnter = () => {
    if (!props.lowPower) setIsOpen(true);
  };
  const handleMouseLeave = () => {
    if (!props.lowPower) setIsOpen(false);
  };
  const handleClick = () => {
    if (props.lowPower) setIsOpen((prev) => !prev);
  };

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative flex w-full flex-col items-end"
    >
        <div className={`flex items-center gap-3 text-right ${props.lowPower ? "cursor-pointer" : "cursor-default"}`}>
        <div className="flex flex-col items-end">
          <span className="text-xl font-semibold tracking-tight text-parchment opacity-80 md:text-2xl">
            {formattedTime}
          </span>
          <span className="text-[0.7rem] tracking-[0.04em] text-slate-100/55">
            {PHASE_LABEL[props.phase]}
          </span>
        </div>
        </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={props.lowPower ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={props.lowPower ? undefined : { opacity: 0, y: -10 }}
            transition={props.lowPower ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
            className={`absolute top-full mt-4 w-[300px] rounded-glass border border-white/10 p-4 ${
              props.lowPower
                ? "bg-slate-900"
                : "bg-slate-900/50 shadow-glass-lg backdrop-blur-lg"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-slate-200/80">
                  {props.mode === "solo" ? (
                    <>
                      <User className="h-3 w-3" />
                      <span>Solo Focus</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3 text-twilight-ember" />
                      <span className="text-twilight-ember">Shared Focus</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => props.onToggleMode()}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  {props.mode === "shared" ? "Go Solo" : "Join Shared"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-full bg-slate-900/50 p-1">
              <button
                type="button"
                onClick={() => props.onStartStop()}
                className="flex-1 rounded-full bg-twilight-ember/80 px-4 py-2 text-sm font-semibold text-twilight shadow-glass-sm transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60"
                aria-pressed={props.isRunning}
              >
                {props.isRunning ? (
                  <Pause className="mx-auto h-5 w-5" />
                ) : (
                  <Play className="mx-auto h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => props.onSkipPhase()}
                className="rounded-full p-3 text-slate-300/70 transition duration-200 hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none"
                aria-label="Skip to next phase"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => props.onReset()}
                className="rounded-full p-3 text-slate-300/70 transition duration-200 hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none"
                aria-label="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-300/70">
                  <span>{props.phase} Time</span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => handleTimeChange(-5)} className="rounded-full p-1 hover:bg-white/10"><Minus className="h-3 w-3" /></button>
                    <span>{props.phase === 'focus' ? props.focusSessionMinutes : props.breakSessionMinutes}m</span>
                    <button onClick={() => handleTimeChange(5)} className="rounded-full p-1 hover:bg-white/10"><Plus className="h-3 w-3" /></button>
                  </span>
                </label>
              </div>
              <div>
                <input
                  type="text"
                  value={props.status}
                  onChange={(e) => props.onStatusChange(e.target.value)}
                  placeholder="What are you focusing on?"
                  className="w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-400/60 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="share-status-checkbox"
                  checked={props.isStatusShared}
                  onChange={(e) => props.onIsStatusSharedChange(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-800 text-twilight-ember focus:ring-twilight-ember/50"
                />
                <label htmlFor="share-status-checkbox" className="text-xs text-slate-300/80">Share with others</label>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
