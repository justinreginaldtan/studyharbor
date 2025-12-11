// lib/features/featureGate.ts

export type SubscriptionStatus =
  | 'free'
  | 'pro'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

// Define pricing tiers as per SPRINT_PLAN.md
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    maxRooms: 1,
    maxParticipants: 10,
    sessionHistory: false,
    customThemes: false,
  },
  pro: {
    name: 'Pro',
    maxRooms: Infinity,
    maxParticipants: 50,
    sessionHistory: true,
    customThemes: true,
    prioritySupport: true,
  },
};

const PRO_STATUSES: SubscriptionStatus[] = ['pro', 'active', 'trialing', 'past_due'];

export function normalizeSubscriptionStatus(rawStatus?: string | null): SubscriptionStatus {
  if (!rawStatus) return 'free';
  const normalized = rawStatus.toLowerCase() as SubscriptionStatus;
  if (Object.keys(PRICING_TIERS).includes(normalized)) {
    return normalized;
  }
  if ((PRO_STATUSES as string[]).includes(normalized)) {
    return normalized;
  }
  return 'free';
}

/**
 * Checks if a user has a paid subscription status.
 */
export function isPro(subscriptionStatus: string | null | undefined): boolean {
  const status = normalizeSubscriptionStatus(subscriptionStatus);
  return PRO_STATUSES.includes(status);
}

/**
 * Checks if a user can create a new room based on their subscription status and current room count.
 */
export function canCreateRoom(userSubscriptionStatus: string | null | undefined, currentRoomCount: number): boolean {
  const tier = isPro(userSubscriptionStatus) ? PRICING_TIERS.pro : PRICING_TIERS.free;
  return currentRoomCount < tier.maxRooms;
}

export function getMaxParticipants(userSubscriptionStatus: string | null | undefined): number {
  const tier = isPro(userSubscriptionStatus) ? PRICING_TIERS.pro : PRICING_TIERS.free;
  return tier.maxParticipants;
}

export function getPlanLabel(status: string | null | undefined): string {
  const normalized = normalizeSubscriptionStatus(status);
  return normalized === 'free' ? 'Free' : 'Pro';
}

export function assertCanCreateRoom(userSubscriptionStatus: string | null | undefined, currentRoomCount: number) {
  const tier = isPro(userSubscriptionStatus) ? PRICING_TIERS.pro : PRICING_TIERS.free;
  const allowed = currentRoomCount < tier.maxRooms;
  return {
    allowed,
    maxRooms: tier.maxRooms,
    reason: allowed ? undefined : 'Room limit reached for your plan',
  };
}
