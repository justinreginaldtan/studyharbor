export const COZY_AVATAR_COLORS = [
  "#FDE68A",
  "#FCA5A5",
  "#BFDBFE",
  "#C4B5FD",
  "#BBF7D0",
  "#FBCFE8",
  "#FDBA74",
  "#A5F3FC",
] as const;

/**
 * Clamp a normalized value to the 0–1 range.
 */
export function clampNormalized(value: number) {
  return Math.min(1, Math.max(0, value));
}

const COZY_FIRST_WORDS = [
  "Mellow",
  "Dreamy",
  "Quiet",
  "Velvet",
  "Soft",
  "Fern",
  "Amber",
  "Moon",
  "Willow",
  "Mist",
  "Sage",
  "Lyric",
  "Hush",
  "Cedar",
  "Cotton",
];

const COZY_SECOND_WORDS = [
  "Glow",
  "Whisper",
  "Lullaby",
  "Bloom",
  "Echo",
  "Cloud",
  "Thread",
  "Fable",
  "Nook",
  "Waltz",
  "Leaf",
  "Harbor",
  "Song",
  "Ember",
  "Murmur",
];

/**
 * Generates a simple random id so each tab can be identified in presence tracking.
 */
export function createGuestId() {
  return `guest-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Picks a consistent cozy color for an avatar.
 */
export function pickAvatarColor() {
  const palette = COZY_AVATAR_COLORS;
  return palette[Math.floor(Math.random() * palette.length)];
}

/**
 * Generates a soft, cozy display name for the guest.
 */
export function createDisplayName() {
  const first =
    COZY_FIRST_WORDS[Math.floor(Math.random() * COZY_FIRST_WORDS.length)];
  const second =
    COZY_SECOND_WORDS[Math.floor(Math.random() * COZY_SECOND_WORDS.length)];
  return `${first} ${second}`;
}

/**
 * Linear interpolation helper that nudges a value toward a target.
 */
export function lerp(current: number, target: number, smoothing: number) {
  return current + (target - current) * smoothing;
}

/**
 * Moves a value toward a target by a maximum delta.
 */
export function approach(
  current: number,
  target: number,
  maxDelta: number
): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}
