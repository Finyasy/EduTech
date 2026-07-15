"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import type { LearnerArtifactSummary } from "@/lib/server/data";

type LessonArtifactPanelProps = {
  lessonId: string;
  clerkEnabled: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const emptyForm = {
  title: "",
  buildType: "Reflection",
  artifactUrl: "",
  reflection: "",
};

function AuthedArtifactPanel({ lessonId }: { lessonId: string }) {
  const { userId } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [artifacts, setArtifacts] = useState<LearnerArtifactSummary[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSignedIn = Boolean(userId);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let isMounted = true;
    const loadArtifacts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/artifacts?lessonId=${lessonId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Unable to load submissions.");
        }
        const data = (await response.json()) as {
          artifacts?: LearnerArtifactSummary[];
        };
        if (isMounted) {
          setArtifacts(data.artifacts ?? []);
        }
      } catch {
        if (isMounted) {
          setMessage("Unable to load submissions.");
          setSaveState("error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadArtifacts();
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, lessonId]);

  const submitArtifact = async () => {
    if (!isSignedIn) {
      setMessage("Sign in to submit your work.");
      setSaveState("error");
      return;
    }

    if (!form.title.trim() || form.reflection.trim().length < 10) {
      setMessage("Add a title and a short reflection before submitting.");
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          title: form.title,
          buildType: form.buildType,
          artifactUrl: form.artifactUrl,
          reflection: form.reflection,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to submit artifact.");
      }

      const artifact = data.artifact as LearnerArtifactSummary;
      setArtifacts((current) => [artifact, ...current]);
      setForm(emptyForm);
      setSaveState("saved");
      setMessage("Submission saved for teacher review.");
    } catch (error) {
      setSaveState("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to submit artifact.",
      );
    }
  };

  if (!isSignedIn) {
    return (
      <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 text-sm text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Build evidence
        </p>
        <p className="mt-3 leading-6">
          Sign in to submit your project reflection and keep evidence of what you built.
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 text-sm text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Build evidence
          </p>
          <h3
            className="mt-2 text-2xl font-semibold text-slate-950"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Submit what you made.
          </h3>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-900">
          Learn / Build / Share
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Project title
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-slate-900"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Build type
          <select
            value={form.buildType}
            onChange={(event) =>
              setForm((current) => ({ ...current, buildType: event.target.value }))
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-slate-900"
          >
            <option>Reflection</option>
            <option>Code</option>
            <option>Prototype</option>
            <option>Drawing</option>
            <option>Demo link</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Link
          <input
            value={form.artifactUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                artifactUrl: event.target.value,
              }))
            }
            placeholder="https://..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-slate-900"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Reflection
          <textarea
            value={form.reflection}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reflection: event.target.value,
              }))
            }
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-slate-900"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void submitArtifact()}
        disabled={saveState === "saving"}
        className="mt-5 min-h-11 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saveState === "saving" ? "Submitting..." : "Submit evidence"}
      </button>

      {message && (
        <p
          className={`mt-3 text-xs ${
            saveState === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
      )}

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Previous submissions
        </p>
        {isLoading ? (
          <p className="mt-3 text-sm text-slate-500">Loading...</p>
        ) : artifacts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No submissions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {artifacts.slice(0, 3).map((artifact) => (
              <li
                key={artifact.id}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
              >
                <p className="font-semibold text-slate-900">{artifact.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {artifact.buildType} / {artifact.status.toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function LessonArtifactPanel({
  lessonId,
  clerkEnabled,
}: LessonArtifactPanelProps) {
  if (!clerkEnabled) {
    return (
      <div className="glass-shell rounded-[2.1rem] border border-white/70 p-6 text-sm text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Build evidence
        </p>
        <p className="mt-3 leading-6">
          Add Clerk keys to enable learner artifact submissions.
        </p>
      </div>
    );
  }

  return <AuthedArtifactPanel lessonId={lessonId} />;
}
