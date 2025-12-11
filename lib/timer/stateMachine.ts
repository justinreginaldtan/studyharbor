import type { TimerState } from "@/lib/types";

export type TimerDurations = {
  focusDurationMs: number;
  breakDurationMs: number;
};

const PHASES: TimerState["phase"][] = ["focus", "break"];

function validateDurations(durations: TimerDurations) {
  if (durations.focusDurationMs <= 0 || durations.breakDurationMs <= 0) {
    throw new Error("Timer durations must be greater than zero");
  }
}

export function createTimerState(
  mode: TimerState["mode"],
  durations: TimerDurations,
  now: number = Date.now()
): TimerState {
  validateDurations(durations);
  return {
    mode,
    phase: "focus",
    remainingMs: durations.focusDurationMs,
    isRunning: false,
    lastUpdatedAt: now,
  };
}

export function toggleMode(
  state: TimerState,
  durations: TimerDurations,
  sharedSnapshot: TimerState | null,
  now: number = Date.now()
): TimerState {
  validateDurations(durations);
  if (state.mode === "shared") {
    return createTimerState("solo", durations, now);
  }

  if (sharedSnapshot) {
    return { ...sharedSnapshot, mode: "shared", lastUpdatedAt: now };
  }
  return createTimerState("shared", durations, now);
}

export function toggleRunning(
  state: TimerState,
  now: number = Date.now()
): TimerState {
  return { ...state, isRunning: !state.isRunning, lastUpdatedAt: now };
}

export function resetTimer(
  state: TimerState,
  durations: TimerDurations,
  now: number = Date.now()
): TimerState {
  validateDurations(durations);
  return {
    ...state,
    phase: "focus",
    remainingMs: durations.focusDurationMs,
    isRunning: false,
    lastUpdatedAt: now,
  };
}

export function skipPhase(
  state: TimerState,
  durations: TimerDurations,
  now: number = Date.now()
): TimerState {
  validateDurations(durations);
  const nextPhase: TimerState["phase"] = state.phase === "focus" ? "break" : "focus";
  const remainingMs =
    nextPhase === "focus" ? durations.focusDurationMs : durations.breakDurationMs;

  return {
    ...state,
    phase: nextPhase,
    remainingMs,
    lastUpdatedAt: now,
  };
}

export function tickTimer(
  state: TimerState,
  now: number,
  durations: TimerDurations
): TimerState {
  validateDurations(durations);
  if (!state.isRunning) return state;
  if (now < state.lastUpdatedAt) {
    throw new Error("Tick called with timestamp earlier than last update");
  }

  const elapsed = now - state.lastUpdatedAt;
  if (elapsed === 0) return state;

  const remainingMs = Math.max(0, state.remainingMs - elapsed);
  let nextPhase = state.phase;
  let nextRemaining = remainingMs;

  if (remainingMs === 0) {
    nextPhase = state.phase === "focus" ? "break" : "focus";
    nextRemaining =
      nextPhase === "focus" ? durations.focusDurationMs : durations.breakDurationMs;
  }

  return {
    ...state,
    phase: nextPhase,
    remainingMs: nextRemaining,
    lastUpdatedAt: now,
  };
}

export function isValidPhase(phase: string): phase is TimerState["phase"] {
  return PHASES.includes(phase as TimerState["phase"]);
}
