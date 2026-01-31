"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-50 px-4">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-slate-600">
        {error.message || "An error occurred while loading this page."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-amber-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
