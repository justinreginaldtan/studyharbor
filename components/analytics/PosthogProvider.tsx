"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics/posthogClient";

export function PosthogProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
