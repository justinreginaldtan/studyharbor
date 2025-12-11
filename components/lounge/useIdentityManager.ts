import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { supabase } from "@/lib/supabaseClient";
import type { Identity } from "@/lib/types";
import { createDisplayName, createGuestId, pickAvatarColor } from "@/lib/utils";
import { useUIStore } from "@/lib/state/uiStore";

const IDENTITY_STORAGE_KEY = "studyharbor.identity";

export function useIdentityManager() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const setAvatarColor = useUIStore((state) => state.setAvatarColor);

  const displayName = identity?.displayName ?? "Settling Wanderer";

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          setShowWelcome(false);
          window.localStorage.removeItem(IDENTITY_STORAGE_KEY);

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_color, subscription_status")
            .eq("id", currentUser.id)
            .single();

          if (error) {
            Sentry.captureException(error);
            setIdentity({
              guestId: currentUser.id,
              displayName: currentUser.email?.split("@")[0] ?? "Wanderer",
              color: pickAvatarColor(),
              subscription_status: "free",
            });
          } else if (profile) {
            setIdentity({
              guestId: profile.id,
              displayName: profile.display_name,
              color: profile.avatar_color,
              subscription_status: profile.subscription_status || "free",
            });
            setAvatarColor(profile.avatar_color);
          }
        } else {
          // Sign out → restore or create guest identity
          const stored = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.guestId && parsed?.displayName && parsed?.color) {
                setIdentity(parsed);
                setShowWelcome(false);
                return;
              }
            } catch {
              window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
            }
          }
          setIdentity({
            guestId: createGuestId(),
            displayName: createDisplayName(),
            color: pickAvatarColor(),
            subscription_status: "free",
          });
          setShowWelcome(true);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setAvatarColor]);

  // Persist guest identity
  useEffect(() => {
    if (!identity || typeof window === "undefined") return;
    if (showWelcome || user) return;
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  }, [identity, showWelcome, user]);

  const handleWelcomeConfirm = useCallback(
    ({ displayName: nextName, color: nextColor }: { displayName: string; color: string }) => {
      const trimmedName = nextName.trim();
      if (!trimmedName) return;
      setIdentity((prev) => {
        const base = prev ?? {
          guestId: createGuestId(),
          displayName: trimmedName,
          color: nextColor,
        };
        const nextIdentity = {
          ...base,
          displayName: trimmedName,
          color: nextColor,
        };
        if (typeof window !== "undefined" && !user) {
          window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(nextIdentity));
        }
        setAvatarColor(nextColor);
        return nextIdentity;
      });
      setShowWelcome(false);
    },
    [setAvatarColor, user]
  );

  const handleContinueAsGuest = useCallback(() => {
    if (!identity) {
      setIdentity({
        guestId: createGuestId(),
        displayName: createDisplayName(),
        color: pickAvatarColor(),
      });
    }
    setShowWelcome(true);
  }, [identity]);

  const syncIdentityColor = useCallback((color: string) => {
    setIdentity((prev) => (prev ? { ...prev, color } : prev));
  }, []);

  return useMemo(
    () => ({
      identity,
      user,
      showWelcome,
      setShowWelcome,
      handleWelcomeConfirm,
      handleContinueAsGuest,
      displayName,
      syncIdentityColor,
    }),
    [
      displayName,
      handleContinueAsGuest,
      handleWelcomeConfirm,
      identity,
      showWelcome,
      user,
      syncIdentityColor,
    ]
  );
}
