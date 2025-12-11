import { trackEvent } from "@/lib/analytics/posthogClient";

export const events = {
  timerStart(payload: { mode: string; phase: string }) {
    trackEvent("timer_start", payload);
  },
  timerPause(payload: { mode: string; phase: string }) {
    trackEvent("timer_pause", payload);
  },
  timerModeToggle(payload: { nextMode: string }) {
    trackEvent("timer_mode_toggle", payload);
  },
  billingPortalOpened() {
    trackEvent("billing_portal_opened");
  },
};
