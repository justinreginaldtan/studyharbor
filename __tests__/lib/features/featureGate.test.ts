import { describe, expect, it } from "vitest";
import {
  canCreateRoom,
  isPro,
  normalizeSubscriptionStatus,
} from "@/lib/features/featureGate";

describe("featureGate", () => {
  it("detects paid statuses", () => {
    expect(isPro("pro")).toBe(true);
    expect(isPro("active")).toBe(true);
    expect(isPro("trialing")).toBe(true);
    expect(isPro("past_due")).toBe(true);
  });

  it("falls back to free for unknown or missing statuses", () => {
    expect(normalizeSubscriptionStatus(undefined)).toBe("free");
    expect(isPro("unknown")).toBe(false);
  });

  it("enforces room creation limits per tier", () => {
    expect(canCreateRoom("free", 0)).toBe(true);
    expect(canCreateRoom("free", 1)).toBe(false);
    expect(canCreateRoom("pro", 5)).toBe(true);
  });
});
