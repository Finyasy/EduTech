"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

type LessonProgressPanelProps = {
  lessonId: string;
  clerkEnabled: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function AuthedProgressPanel({ lessonId }: { lessonId: string }) {
  const { userId } = useAuth();
  const [progress, setProgress] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const formattedCompletionDate = completedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(completedAt))
    : null;

  const isSignedIn = Boolean(userId);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!isSignedIn) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/progress?lessonId=${lessonId}`);
        if (!response.ok) {
          throw new Error("Failed to load progress.");
        }
        const data = (await response.json()) as {
          watchPercent?: number;
          completedAt?: string | null;
        };
        if (isMounted) {
          setProgress(Number.isFinite(data.watchPercent) ? data.watchPercent ?? 0 : 0);
          setCompletedAt(data.completedAt ?? null);
        }
      } catch {
        if (isMounted) {
          setMessage("Unable to load progress.");
          setSaveState("error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, lessonId]);

  useEffect(() => {
    if (saveState !== "saved") {
      return;
    }

    const timer = setTimeout(() => {
      setSaveState("idle");
      setMessage(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [saveState]);

  const persistProgress = async (watchPercent: number, completed?: boolean) => {
    if (!isSignedIn) {
      setMessage("Sign in to save progress.");
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          watchPercent,
          completed,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save progress.");
      }

      setProgress(watchPercent);
      setSaveState("saved");
      if (completed) {
        setCompletedAt(new Date().toISOString());
      }
      setMessage(completed ? "Lesson marked complete!" : "Progress saved.");
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Failed to save progress.");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_34%,#14346f_100%)] p-6 text-white shadow-skyline">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/54">
          Save your streak
        </p>
        <h3
          className="mt-3 text-2xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sign in to keep your lesson progress.
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/72">
          Track what you watched, mark lessons complete, and build a visible streak over time.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 text-sm text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Progress
          </p>
          <p
            className="mt-2 text-3xl font-semibold text-slate-950"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isLoading ? "Loading..." : `${progress}%`}
          </p>
          {completedAt && (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Completed {formattedCompletionDate}
            </p>
          )}
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-900">
          Lesson tracker
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>Watch progress</span>
          <span>{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          className="w-full accent-slate-950"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => persistProgress(progress, progress >= 100)}
          disabled={saveState === "saving"}
          className="min-h-11 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save progress
        </button>
        <button
          type="button"
          onClick={() => persistProgress(100, true)}
          disabled={saveState === "saving" || Boolean(completedAt)}
          className="min-h-11 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {completedAt ? "Completed" : "Mark complete"}
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-xs ${saveState === "error" ? "text-rose-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default function LessonProgressPanel({
  lessonId,
  clerkEnabled,
}: LessonProgressPanelProps) {
  if (!clerkEnabled) {
    return (
      <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 text-sm text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Progress tracking
        </p>
        <h3
          className="mt-3 text-2xl font-semibold text-slate-950"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Auth is off in this environment.
        </h3>
        <p className="mt-3 leading-6">
          Add Clerk keys to <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code> to
          enable learner progress tracking.
        </p>
      </div>
    );
  }

  return <AuthedProgressPanel lessonId={lessonId} />;
}
