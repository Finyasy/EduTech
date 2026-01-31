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
          setProgress(
            Number.isFinite(data.watchPercent) ? data.watchPercent ?? 0 : 0,
          );
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
      setMessage(
        error instanceof Error ? error.message : "Failed to save progress.",
      );
    }
  };

  if (!isSignedIn) {
    return (
      <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Track your progress</p>
        <p className="mt-2">
          Sign in to save your watch progress and earn streaks.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-flex rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-sm text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Progress
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">
        {isLoading ? "Loading..." : `${progress}%`}
      </p>
      {completedAt && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Completed {formattedCompletionDate}
        </p>
      )}
      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => persistProgress(progress, progress >= 100)}
          disabled={saveState === "saving"}
          className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save progress
        </button>
        <button
          type="button"
          onClick={() => persistProgress(100, true)}
          disabled={saveState === "saving" || Boolean(completedAt)}
          className="rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {completedAt ? "Completed" : "Mark complete"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-xs ${
            saveState === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
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
      <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Progress tracking</p>
        <p className="mt-2">
          Auth is off. Add Clerk keys to{" "}
          <code className="rounded bg-amber-200/50 px-1">.env</code> to enable
          progress tracking.
        </p>
      </div>
    );
  }

  return <AuthedProgressPanel lessonId={lessonId} />;
}
