"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LearnerArtifactSummary } from "@/lib/server/data";

type RecentArtifactsPanelProps = {
  classId: string | null;
};

const defaultScores = { ai: 2, coding: 2, math: 2 };

export default function RecentArtifactsPanel({ classId }: RecentArtifactsPanelProps) {
  const [artifacts, setArtifacts] = useState<LearnerArtifactSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoresByArtifact, setScoresByArtifact] = useState<
    Record<string, typeof defaultScores>
  >({});
  const [feedbackByArtifact, setFeedbackByArtifact] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadArtifacts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ limit: "8" });
        if (classId) {
          query.set("classId", classId);
        }
        const response = await fetch(`/api/teach/artifacts?${query.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Unable to load learner artifacts.");
        }
        const data = (await response.json()) as {
          artifacts?: LearnerArtifactSummary[];
        };
        if (isMounted) {
          setArtifacts(data.artifacts ?? []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load learner artifacts.",
          );
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
  }, [classId]);

  const scoreArtifact = async (artifactId: string) => {
    setReviewingId(artifactId);
    setError(null);
    try {
      const response = await fetch(`/api/teach/artifacts/${artifactId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: scoresByArtifact[artifactId] ?? defaultScores,
          feedback: feedbackByArtifact[artifactId] ?? "",
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to score artifact.");
      }
      setArtifacts((current) =>
        current.map((artifact) =>
          artifact.id === artifactId
            ? { ...artifact, status: "REVIEWED" as const }
            : artifact,
        ),
      );
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to score artifact.",
      );
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Recent learner artifacts
          </p>
          <h3
            className="mt-2 text-xl font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Build evidence waiting for review
          </h3>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          {artifacts.length}
        </span>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading submissions...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-600">{error}</p>
      ) : artifacts.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          No linked learner submissions yet. Add learners with their account email to filter class artifacts here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {artifacts.map((artifact) => (
            <li
              key={artifact.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{artifact.title}</p>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {artifact.buildType}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {artifact.learnerName ?? artifact.learnerEmail} / {artifact.courseTitle}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {artifact.reflection}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <Link
                  href={`/courses/${artifact.courseId}/lessons/${artifact.lessonId}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700"
                >
                  Open lesson
                </Link>
                {artifact.artifactUrl && (
                  <a
                    href={artifact.artifactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-800"
                  >
                    Open artifact
                  </a>
                )}
              </div>
              <div className="mt-4 grid gap-2 border-t border-slate-200 pt-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["ai", "coding", "math"] as const).map((dimension) => (
                    <label
                      key={`${artifact.id}-${dimension}`}
                      className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                    >
                      {dimension}
                      <select
                        value={(scoresByArtifact[artifact.id] ?? defaultScores)[dimension]}
                        onChange={(event) =>
                          setScoresByArtifact((current) => ({
                            ...current,
                            [artifact.id]: {
                              ...(current[artifact.id] ?? defaultScores),
                              [dimension]: Number(event.target.value),
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-normal text-slate-800"
                      >
                        {[0, 1, 2, 3, 4].map((score) => (
                          <option key={score} value={score}>
                            {score}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <textarea
                  value={feedbackByArtifact[artifact.id] ?? ""}
                  onChange={(event) =>
                    setFeedbackByArtifact((current) => ({
                      ...current,
                      [artifact.id]: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Review feedback"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => void scoreArtifact(artifact.id)}
                  disabled={reviewingId === artifact.id}
                  className="w-fit rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {artifact.status === "REVIEWED" ? "Update review" : "Save review"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
