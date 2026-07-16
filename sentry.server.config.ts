import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Without a DSN the SDK stays fully disabled, matching the app's
  // convention of degrading gracefully when a service is not configured.
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Kids' product: never attach request bodies, cookies, or user IP data.
  sendDefaultPii: false,
});
