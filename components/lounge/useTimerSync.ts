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
};

export function useTimerSync({
  identity,
  showWelcome,
  focusDurationMs,
  breakDurationMs,
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

  // Sync duration refs and reset if updated while idle on focus phase
  useEffect(() => {
    durationsRef.current = { focusDurationMs, breakDurationMs };
    setTimerState((prev) => {
      if (prev.phase !== "focus" || prev.isRunning) return prev;
      if (prev.remainingMs === focusDurationMs) return prev;
      return { ...prev, remainingMs: focusDurationMs };
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
    const tick = () => {
      const timer = timerRef.current;
      if (timer.isRunning) {
        const now = Date.now();
        const elapsed = now - timer.lastUpdatedAt;

        if (elapsed >= 250) { // Update state roughly 4 times a second
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
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [focusDurationMs, breakDurationMs]);

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

  }, [identity, showWelcome, focusDurationMs, updateTimerState]);

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
