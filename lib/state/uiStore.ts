import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Legacy types kept for backwards compatibility
export type ThemeVariant = "twilight" | "dawn" | "night";
export type SessionPreset = 15 | 25 | 50;

type UIState = {
  ambientVolume: number;
  focusSessionMinutes: number;
  breakSessionMinutes: number;
  avatarColor: string;
  ambientPlaying: boolean;
  isAuthModalOpen: boolean;
  setAmbientVolume: (volume: number) => void;
  setFocusSessionMinutes: (minutes: number) => void;
  setBreakSessionMinutes: (minutes: number) => void;
  setAvatarColor: (hex: string) => void;
  setAmbientPlaying: (playing: boolean) => void;
  toggleAuthModal: (isOpen: boolean) => void;
};

const DEFAULTS: Pick<
  UIState,
  | "ambientVolume"
  | "focusSessionMinutes"
  | "breakSessionMinutes"
  | "avatarColor"
> = {
  ambientVolume: 0.65,
  focusSessionMinutes: 25,
  breakSessionMinutes: 5,
  avatarColor: "#F8DCA4",
};

// Cached server snapshot to avoid infinite loops
const serverSnapshot: UIState = {
  ...DEFAULTS,
  ambientPlaying: false,
  isAuthModalOpen: false,
  setAmbientVolume: () => {},
  setFocusSessionMinutes: () => {},
  setBreakSessionMinutes: () => {},
  setAvatarColor: () => {},
  setAmbientPlaying: () => {},
  toggleAuthModal: () => {},
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      ambientPlaying: false,
      isAuthModalOpen: false,
      setAmbientVolume: (ambientVolume) =>
        set({
          ambientVolume: Math.max(0, Math.min(1, ambientVolume)),
        }),
      setFocusSessionMinutes: (focusSessionMinutes) =>
        set({ focusSessionMinutes }),
      setBreakSessionMinutes: (breakSessionMinutes) =>
        set({ breakSessionMinutes }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setAmbientPlaying: (ambientPlaying) => set({ ambientPlaying }),
      toggleAuthModal: (isAuthModalOpen) => set({ isAuthModalOpen }),
    }),
    {
      name: "studyharbor.ui",
      version: 2, // Increment version for schema change
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Add cached getServerSnapshot for React 19 useSyncExternalStore
// @ts-ignore - Adding getServerSnapshot for SSR support
useUIStore.getServerSnapshot = () => serverSnapshot;
