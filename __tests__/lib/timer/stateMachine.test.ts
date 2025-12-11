import { describe, expect, it, vi } from "vitest";
import {
  createTimerState,
  isValidPhase,
  resetTimer,
  skipPhase,
  tickTimer,
  toggleMode,
  toggleRunning,
  type TimerDurations,
} from "@/lib/timer/stateMachine";

const durations: TimerDurations = {
  focusDurationMs: 25 * 60 * 1000,
  breakDurationMs: 5 * 60 * 1000,
};

describe("timer state machine", () => {
  it("creates an initial timer state", () => {
    const now = 1000;
    const state = createTimerState("solo", durations, now);
    expect(state).toMatchObject({
      mode: "solo",
      phase: "focus",
      remainingMs: durations.focusDurationMs,
      isRunning: false,
      lastUpdatedAt: now,
    });
  });

  it("rejects invalid durations", () => {
    expect(() =>
      createTimerState("solo", { focusDurationMs: 0, breakDurationMs: 1 })
    ).toThrow();
    expect(() =>
      skipPhase(createTimerState("solo", durations), {
        focusDurationMs: -1,
        breakDurationMs: 1,
      })
    ).toThrow();
  });

  it("toggles running state and stamps time", () => {
    const now = 5000;
    const state = createTimerState("solo", durations, 0);
    const running = toggleRunning(state, now);
    expect(running.isRunning).toBe(true);
    expect(running.lastUpdatedAt).toBe(now);
    const stopped = toggleRunning(running, now + 1000);
    expect(stopped.isRunning).toBe(false);
  });

  it("skips phases and keeps timers aligned", () => {
    const state = createTimerState("solo", durations, 0);
    const skipped = skipPhase(state, durations, 100);
    expect(skipped.phase).toBe("break");
    expect(skipped.remainingMs).toBe(durations.breakDurationMs);
    expect(skipped.lastUpdatedAt).toBe(100);
  });

  it("resets timer to focus phase and stops it", () => {
    const running = toggleRunning(createTimerState("solo", durations), 123);
    const reset = resetTimer(running, durations, 200);
    expect(reset.isRunning).toBe(false);
    expect(reset.phase).toBe("focus");
    expect(reset.remainingMs).toBe(durations.focusDurationMs);
    expect(reset.lastUpdatedAt).toBe(200);
  });

  it("ticks time forward without changing stopped timers", () => {
    const state = createTimerState("solo", durations, 0);
    const ticked = tickTimer(state, 10, durations);
    expect(ticked).toEqual(state);
  });

  it("ticks down running timers and switches phase at zero", () => {
    const start = toggleRunning(createTimerState("solo", durations, 0), 0);
    const almostDone = tickTimer(start, durations.focusDurationMs - 1000, durations);
    expect(almostDone.remainingMs).toBe(1000);
    const nextPhase = tickTimer(almostDone, durations.focusDurationMs, durations);
    expect(nextPhase.phase).toBe("break");
    expect(nextPhase.remainingMs).toBe(durations.breakDurationMs);
  });

  it("throws if tick timestamp goes backward", () => {
    const running = toggleRunning(createTimerState("solo", durations, 1000), 1000);
    expect(() => tickTimer(running, 999, durations)).toThrow();
  });

  it("honors shared snapshot on toggle", () => {
    const sharedSnapshot = createTimerState("shared", durations, 0);
    const solo = createTimerState("solo", durations, 0);
    const toShared = toggleMode(solo, durations, sharedSnapshot, 10);
    expect(toShared.mode).toBe("shared");
    expect(toShared.lastUpdatedAt).toBe(10);
    const backToSolo = toggleMode(toShared, durations, sharedSnapshot, 20);
    expect(backToSolo.mode).toBe("solo");
    expect(backToSolo.phase).toBe("focus");
  });

  it("validates phases", () => {
    expect(isValidPhase("focus")).toBe(true);
    expect(isValidPhase("break")).toBe(true);
    expect(isValidPhase("weird")).toBe(false);
  });
});
