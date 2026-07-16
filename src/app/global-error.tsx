"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // global-error replaces the root layout, so it must render its own
  // <html> and <body> tags and cannot rely on app-level providers.
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-50 px-4">
          <h1 className="text-xl font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="max-w-md text-center text-sm text-slate-600">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
