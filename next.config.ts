import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Source-map upload only runs when SENTRY_AUTH_TOKEN, SENTRY_ORG, and
// SENTRY_PROJECT are set; otherwise the wrapper builds normally.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  webpack: { treeshake: { removeDebugLogging: true } },
  widenClientFileUpload: true,
});
