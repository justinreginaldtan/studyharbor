import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserStats, type FocusSession } from "@/lib/analytics/queries";

const mockChain = vi.hoisted(() => {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn();
  return chain;
});

const mockFrom = vi.hoisted(() => vi.fn(() => mockChain));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getUserStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain.select.mockImplementation(() => mockChain);
    mockChain.eq.mockImplementation(() => mockChain);
    mockChain.order.mockReset();
  });

  it("computes totals and streaks from focus sessions", async () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        user_id: "user-1",
        room_id: null,
        session_type: "focus",
        duration_ms: 25 * 60 * 1000,
        completed_at: "2024-01-03T10:00:00Z",
      },
      {
        id: "2",
        user_id: "user-1",
        room_id: null,
        session_type: "focus",
        duration_ms: 30 * 60 * 1000,
        completed_at: "2024-01-02T12:00:00Z",
      },
      {
        id: "3",
        user_id: "user-1",
        room_id: null,
        session_type: "focus",
        duration_ms: 20 * 60 * 1000,
        completed_at: "2024-01-01T08:00:00Z",
      },
    ];

    mockChain.order.mockResolvedValue({ data: sessions, error: null });

    const result = await getUserStats("user-1");

    expect(mockFrom).toHaveBeenCalledWith("focus_sessions");
    expect(result.error).toBeNull();
    expect(result.totalSessions).toBe(3);
    expect(result.totalMinutes).toBeCloseTo(75);
    expect(result.averageSessionLength).toBeCloseTo(25);
    expect(result.longestStreak).toBe(3);
  });

  it("returns safe defaults on query error", async () => {
    mockChain.order.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const result = await getUserStats("user-2");

    expect(result.error).toBe("boom");
    expect(result.totalSessions).toBe(0);
    expect(result.sessions).toEqual([]);
  });
});
