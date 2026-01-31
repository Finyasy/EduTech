"use client";

import { useState } from "react";
import Link from "next/link";

type LessonActionsProps = {
  lessonId: string;
  nextLessonHref: string;
};

export default function LessonActions({
  lessonId,
  nextLessonHref,
}: LessonActionsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const markComplete = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          watchPercent: 100,
          completed: true,
        }),
      });
      setIsComplete(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={markComplete}
        disabled={isSaving}
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isSaving ? "Saving..." : isComplete ? "Completed" : "Mark complete"}
      </button>
      <Link
        href={nextLessonHref}
        className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
      >
        {nextLessonHref === "/dashboard" ? "Go to dashboard" : "Next lesson"}
      </Link>
    </div>
  );
}
