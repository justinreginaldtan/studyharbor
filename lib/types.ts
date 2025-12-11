export type Identity = {
  guestId: string;
  displayName: string;
  color: string;
  subscription_status?: string;
};

export type AvatarPresence = {
  id: string;
  color: string;
  name: string;
  x: number;
  y: number;
  updatedAt: number;
  status?: string;
};

export type TimerMode = "solo" | "shared";

export type TimerPhase = "focus" | "break";

export type TimerState = {
  mode: TimerMode;
  phase: TimerPhase;
  remainingMs: number;
  isRunning: boolean;
  lastUpdatedAt: number;
};

export type RenderAvatar = {
  id: string;
  color: string;
  name: string;
  x: number;
  y: number;
  isSelf: boolean;
  isHovered: boolean;
  status?: string;
};
