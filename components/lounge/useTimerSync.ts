"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Identity, TimerState } from "@/lib/types";
import * as Sentry from "@sentry/nextjs";
import {
  createTimerState,
  resetTimer,
  skipPhase,
  tickTimer,
  toggleMode,
  toggleRunning,
  type TimerDurations,
} from "@/lib/timer/stateMachine";

const TIMER_BROADCAST_INTERVAL_MS = 1000;

type UseTimerSyncProps = {
  identity: Identity | null;
  showWelcome: boolean;
  focusDurationMs: number;
  breakDurationMs: number;
  lowPower: boolean;
};

export function useTimerSync({
  identity,
  showWelcome,
  focusDurationMs,
  breakDurationMs,
  lowPower,
}: UseTimerSyncProps) {
  const durationsRef = useRef<TimerDurations>({
    focusDurationMs,
    breakDurationMs,
  });
  const [timerState, setTimerState] = useState<TimerState>(() =>
    createTimerState("solo", durationsRef.current)
  );
  
  const timerRef = useRef<TimerState>(timerState);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sharedTimerSnapshotRef = useRef<TimerState | null>(null);
  const lastTimerBroadcastRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = timerState;
  }, [timerState]);

  // Sync duration refs and update remainingMs if timer is idle
  useEffect(() => {
    durationsRef.current = { focusDurationMs, breakDurationMs };
    setTimerState((prev) => {
      // Only update remaining time if timer is not running
      if (prev.isRunning) return prev;

      const targetDuration = prev.phase === "focus" ? focusDurationMs : breakDurationMs;
      if (prev.remainingMs === targetDuration) return prev;
      return { ...prev, remainingMs: targetDuration, lastUpdatedAt: Date.now() };
    });
  }, [focusDurationMs, breakDurationMs]);

  // Connect to Supabase channel for timer events
  useEffect(() => {
    if (!identity || showWelcome) return;

    const channel = supabase.channel(`studyharbor-room-timer`); // Separate channel for timer
    channelRef.current = channel;

    channel.on("broadcast", { event: "timer:update" }, ({ payload }) => {
      if (!payload) return;
      const incoming = payload as TimerState;
      const normalized: TimerState = { ...incoming, mode: "shared", lastUpdatedAt: Date.now() };
      sharedTimerSnapshotRef.current = normalized;
      if (timerRef.current.mode === "shared") {
        setTimerState(normalized);
      }
    });

    channel.on("broadcast", { event: "timer:request-sync" }, () => {
      if (timerRef.current.mode === "shared") {
        const snapshot = { ...timerRef.current, lastUpdatedAt: Date.now() };
        sharedTimerSnapshotRef.current = snapshot;
        lastTimerBroadcastRef.current = snapshot.lastUpdatedAt;
        channel.send({
          type: "broadcast",
          event: "timer:update",
          payload: snapshot,
        });
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "timer:request-sync",
          payload: { requesterId: identity.guestId },
        });
      }
      if (status === "CHANNEL_ERROR") {
        Sentry.captureMessage("Timer channel error");
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [identity, showWelcome]);
  
  // The main timer countdown loop
  useEffect(() => {
    const runTick = (now: number) => {
      const timer = timerRef.current;
      if (!timer.isRunning) return;

      setTimerState((current) => {
        const updated = tickTimer(current, now, durationsRef.current);

        if (
          updated.mode === "shared" &&
          now - lastTimerBroadcastRef.current >= TIMER_BROADCAST_INTERVAL_MS &&
          (updated.remainingMs !== current.remainingMs || updated.phase !== current.phase)
        ) {
          lastTimerBroadcastRef.current = now;
          sharedTimerSnapshotRef.current = updated;
          channelRef.current?.send({
            type: "broadcast",
            event: "timer:update",
            payload: updated,
          });
        }
        return updated;
      });
    };

    if (lowPower) {
      const intervalId = window.setInterval(() => {
        runTick(Date.now());
      }, 1000);
      return () => {
        window.clearInterval(intervalId);
      };
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = now - timerRef.current.lastUpdatedAt;

      if (elapsed >= 250) {
        runTick(now);
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [lowPower]); // Don't include durations - we read from durationsRef.current

  const updateTimerState = useCallback(
    (
      updater: (prev: TimerState, now: number) => TimerState,
      options: { broadcast?: boolean } = {}
    ) => {
      const shouldBroadcast = options.broadcast ?? true;
      const now = Date.now();
      const nextState = updater(timerRef.current, now);
      const stampedState = { ...nextState, lastUpdatedAt: now };

      setTimerState(stampedState);

      if (shouldBroadcast && stampedState.mode === "shared") {
        sharedTimerSnapshotRef.current = stampedState;
        lastTimerBroadcastRef.current = stampedState.lastUpdatedAt;
        channelRef.current?.send({
          type: "broadcast",
          event: "timer:update",
          payload: stampedState,
        });
      }
      return stampedState;
    },
    []
  );

  const handleToggleMode = useCallback(() => {
    if (!identity || showWelcome) return;

    updateTimerState((prev, now) => {
      return toggleMode(prev, durationsRef.current, sharedTimerSnapshotRef.current, now);
    }, { broadcast: false });
    
    // Request a sync to get the latest state from others
    channelRef.current?.send({
      type: "broadcast",
      event: "timer:request-sync",
      payload: { requesterId: identity.guestId },
    });

  }, [identity, showWelcome, updateTimerState]);

  const handleStartStop = useCallback(() => {
    updateTimerState((prev, now) => toggleRunning(prev, now));
  }, [updateTimerState]);

  const handleResetTimer = useCallback(() => {
    updateTimerState((prev, now) => resetTimer(prev, durationsRef.current, now));
  }, [updateTimerState]);

  const handleSkipPhase = useCallback(() => {
    updateTimerState((prev, now) => skipPhase(prev, durationsRef.current, now));
  }, [updateTimerState]);

  return {
    timerState,
    handleToggleMode,
    handleStartStop,
    handleResetTimer,
    handleSkipPhase,
  };
}
