// sentry.edge.config.ts
// This file configures the initialization of Sentry for edge environments (e.g. Vercel Edge Functions)
// The config you add here will be used whenever an Edge function is invoked

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Setting this option to true will automatically bundle your source maps to Sentry
  // This increases clientside bundle size and labor for you.
  // Set to false for now, to avoid bundling issues with LLM.
  // Set to true in production deployments.
  // debug: true,
});
