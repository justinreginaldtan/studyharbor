"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Identity, AvatarPresence, RenderAvatar } from "@/lib/types";
import { approach, lerp, clampNormalized } from "@/lib/utils";

const MOVE_SPEED = 0.13;
const REMOTE_SMOOTHING = 0.18;
const PRESENCE_BROADCAST_INTERVAL_MS = 120;
const LOW_POWER_BROADCAST_INTERVAL_MS = 1000;
const LOW_POWER_TICK_INTERVAL_MS = 1000;
const MAX_STATUS_LENGTH = 120;

const sanitizeStatus = (value: string | undefined) => {
  if (!value) return undefined;
  const cleaned = value.replace(/<[^>]*>/g, "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, MAX_STATUS_LENGTH);
};

type RemoteAvatarState = {
  color: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  status?: string;
};

type UsePresenceManagerProps = {
  identity: Identity | null;
  showWelcome: boolean;
  isStatusShared: boolean;
  status: string;
  lowPower: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  targetPositionRef: React.RefObject<{ x: number; y: number }>;
  onToast: (message: string, color?: string) => void;
};

export function usePresenceManager({
  identity,
  showWelcome,
  isStatusShared,
  status,
  lowPower,
  containerRef,
  targetPositionRef,
  onToast,
}: UsePresenceManagerProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceReadyRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastPresenceBroadcastRef = useRef(0);

  const localPositionRef = useRef({ x: 0.5, y: 0.68 });
  const remoteAvatarsRef = useRef<Map<string, RemoteAvatarState>>(new Map());
  const hoveredAvatarRef = useRef<string | null>(null);
  const previousPresenceIdsRef = useRef<Set<string>>(new Set());

  const [avatars, setAvatars] = useState<RenderAvatar[]>([]);
  const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  useEffect(() => {
    hoveredAvatarRef.current = hoveredAvatarId;
  }, [hoveredAvatarId]);

  const handleHoverChange = useCallback((avatarId: string, hovering: boolean) => {
    setHoveredAvatarId((prev) => {
      if (hovering) return avatarId;
      return prev === avatarId ? null : prev;
    });
  }, []);

  useEffect(() => {
    if (!identity || showWelcome) return;

    const { guestId, displayName, color } = identity;

    setConnectionStatus("connecting");
    const channel = supabase.channel("studyharbor-room", {
      config: { presence: { key: guestId } },
    });
    channelRef.current = channel;

    const handlePresenceSync = () => {
      const presenceState = channel.presenceState<AvatarPresence>();
      const nextRemotes = new Map<string, RemoteAvatarState>();
      const currentPresenceIds = new Set<string>();
      let participantCount = 0;

      Object.values(presenceState).forEach((connections) => {
        connections.forEach((p) => {
          if (p?.id === guestId || !p?.id) return;
          
          participantCount++;
          currentPresenceIds.add(p.id);

          const normalizedX = clampNormalized(p.x);
          const normalizedY = clampNormalized(p.y);
          const existing = remoteAvatarsRef.current.get(p.id);

          nextRemotes.set(
            p.id,
            existing
              ? { ...existing, color: p.color, name: p.name ?? "Wanderer", targetX: normalizedX, targetY: normalizedY, status: sanitizeStatus(p.status) }
              : { color: p.color, name: p.name ?? "Wanderer", x: normalizedX, y: normalizedY, targetX: normalizedX, targetY: normalizedY, status: sanitizeStatus(p.status) }
          );
        });
      });

      currentPresenceIds.forEach((id) => {
        if (!previousPresenceIdsRef.current.has(id)) {
          const newcomer = nextRemotes.get(id);
          if (newcomer) onToast(`${newcomer.name} joined 💛`, newcomer.color);
        }
      });

      previousPresenceIdsRef.current.forEach((id) => {
        if (!currentPresenceIds.has(id)) {
          const leaver = remoteAvatarsRef.current.get(id);
          if (leaver) onToast(`${leaver.name} left`, leaver.color);
        }
      });

      previousPresenceIdsRef.current = currentPresenceIds;
      remoteAvatarsRef.current = nextRemotes;
      setOnlineCount(participantCount);
    };

    channel.on("presence", { event: "sync" }, handlePresenceSync);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus("connected");
        channel.track({
          id: guestId,
          name: displayName,
          color: color,
          x: localPositionRef.current.x,
          y: localPositionRef.current.y,
          updatedAt: Date.now(),
        })
          .then(() => {
            presenceReadyRef.current = true;
          })
          .catch((err) => {
            console.error("[Presence] track error", err);
            setConnectionStatus("error");
          });
      } else if (status === "CHANNEL_ERROR") {
        setConnectionStatus("error");
      } else if (status === "TIMED_OUT" || status === "CLOSED") {
        setConnectionStatus("connecting");
      }
    });

    return () => {
      presenceReadyRef.current = false;
      channel.unsubscribe();
      channelRef.current = null;
      remoteAvatarsRef.current.clear();
      previousPresenceIdsRef.current.clear();
    };
  }, [identity, showWelcome, onToast]);

  useEffect(() => {
    if (!identity || showWelcome) {
      setAvatars([]);
      return;
    }
    
    const { guestId, displayName, color } = identity;
    lastFrameRef.current = null;

    const tick = (frameTime: number) => {
      const previous = lastFrameRef.current ?? frameTime;
      const deltaSeconds = Math.min(
        lowPower ? 1 : 0.12,
        (frameTime - previous) / 1000
      );
      lastFrameRef.current = frameTime;

      const container = containerRef.current;
      const width = container?.clientWidth ?? window.innerWidth;
      const height = container?.clientHeight ?? window.innerHeight;

      if (deltaSeconds > 0) {
        localPositionRef.current.x = approach(localPositionRef.current.x, targetPositionRef.current.x, MOVE_SPEED * deltaSeconds);
        localPositionRef.current.y = approach(localPositionRef.current.y, targetPositionRef.current.y, MOVE_SPEED * deltaSeconds);
      }

      const nowMs = Date.now();
      const broadcastIntervalMs = lowPower
        ? LOW_POWER_BROADCAST_INTERVAL_MS
        : PRESENCE_BROADCAST_INTERVAL_MS;
      if (
        presenceReadyRef.current &&
        channelRef.current &&
        nowMs - lastPresenceBroadcastRef.current > broadcastIntervalMs
      ) {
        channelRef.current.track({
          id: guestId,
          name: displayName,
          color: color,
          x: localPositionRef.current.x,
          y: localPositionRef.current.y,
          updatedAt: nowMs,
          status: isStatusShared ? sanitizeStatus(status) : undefined,
        });
        lastPresenceBroadcastRef.current = nowMs;
      }

      const hoveredId = hoveredAvatarRef.current;
      const renderList: RenderAvatar[] = [{
        id: guestId,
        color: color,
        name: displayName,
        x: localPositionRef.current.x * width,
        y: localPositionRef.current.y * height,
        isSelf: true,
        isHovered: hoveredId === guestId,
        status: isStatusShared ? sanitizeStatus(status) : undefined,
      }];

      remoteAvatarsRef.current.forEach((avatar, id) => {
        if (lowPower) {
          avatar.x = avatar.targetX;
          avatar.y = avatar.targetY;
        } else {
          avatar.x = lerp(avatar.x, avatar.targetX, REMOTE_SMOOTHING);
          avatar.y = lerp(avatar.y, avatar.targetY, REMOTE_SMOOTHING);
        }
        renderList.push({
          id,
          color: avatar.color,
          name: avatar.name,
          x: avatar.x * width,
          y: avatar.y * height,
          isSelf: false,
          isHovered: hoveredId === id,
          status: avatar.status,
        });
      });

      setAvatars(renderList);
    };

    if (lowPower) {
      const intervalId = window.setInterval(() => {
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        tick(now);
      }, LOW_POWER_TICK_INTERVAL_MS);
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      tick(now);
      return () => {
        window.clearInterval(intervalId);
        lastFrameRef.current = null;
      };
    }

    animationRef.current = requestAnimationFrame(function frame(time) {
      tick(time);
      animationRef.current = requestAnimationFrame(frame);
    });
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastFrameRef.current = null;
    };
  }, [
    identity,
    showWelcome,
    status,
    isStatusShared,
    containerRef,
    targetPositionRef,
    lowPower,
  ]);

  return { avatars, onlineCount, handleHoverChange, connectionStatus };
}
