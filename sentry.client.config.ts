// sentry.client.config.ts
// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a client-side route is accessed.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Setting this option to true will automatically bundle your source maps to Sentry
  // This increases clientside bundle size and labor for you.
  // Set to false for now, to avoid bundling issues with LLM.
  // Set to true in production deployments.
  // debug: true,
  // replay: {
  //   // If you're not already doing this, you may need to add some of your
  //   // data-handling logic to a `beforeAddAttachment` callback.
  //   // We recommend checking the documentation for more information:
  //   // https://docs.sentry.io/platforms/javascript/guides/nextjs/session-replay/
  // },

  // You can remove this option if you're not using it.
  integrations: [Sentry.replayIntegration()],
});
