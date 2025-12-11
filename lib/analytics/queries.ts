// lib/analytics/queries.ts

import { supabase } from "@/lib/supabaseClient";

export type FocusSession = {
  id: string;
  user_id: string;
  room_id: string | null;
  session_type: "focus" | "break";
  duration_ms: number;
  completed_at: string;
};

export type UserStats = {
  totalSessions: number;
  totalMinutes: number;
  longestStreak: number;
  averageSessionLength: number;
  sessions: FocusSession[];
  error: string | null;
};

function calculateStreak(sessions: FocusSession[]): number {
  if (!sessions.length) return 0;

  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );

  let longest = 0;
  let current = 0;
  let previousDay: number | null = null;
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (const session of sorted) {
    const completedAt = new Date(session.completed_at);
    if (Number.isNaN(completedAt.getTime())) continue;
    const dayStart = Date.UTC(
      completedAt.getUTCFullYear(),
      completedAt.getUTCMonth(),
      completedAt.getUTCDate()
    );

    if (previousDay === null) {
      current = 1;
    } else {
      const dayDiff = Math.round((previousDay - dayStart) / DAY_MS);
      if (dayDiff === 0) {
        // Same day: keep streak length the same
      } else if (dayDiff === 1) {
        current += 1;
      } else {
        current = 1;
      }
    }

    previousDay = dayStart;
    longest = Math.max(longest, current);
  }

  return longest;
}

function calculateAverageMinutes(sessions: FocusSession[]): number {
  if (!sessions.length) return 0;
  const totalDuration = sessions.reduce((acc, s) => acc + s.duration_ms, 0);
  return totalDuration / sessions.length / 60000;
}

/**
 * Fetches user focus session data and calculates key statistics.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .select(
        "id, user_id, room_id, session_type, duration_ms, completed_at"
      )
      .eq("user_id", userId)
      .eq("session_type", "focus")
      .order("completed_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const sessions: FocusSession[] = data ?? [];
    return {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce(
        (acc, s) => acc + s.duration_ms / 60000,
        0
      ),
      longestStreak: calculateStreak(sessions),
      averageSessionLength: calculateAverageMinutes(sessions),
      sessions,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching stats";
    console.error("Error fetching focus sessions:", message);
    return {
      totalSessions: 0,
      totalMinutes: 0,
      longestStreak: 0,
      averageSessionLength: 0,
      sessions: [],
      error: message,
    };
  }
}
