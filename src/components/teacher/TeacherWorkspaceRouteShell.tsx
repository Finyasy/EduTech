"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TeacherWorkspaceClient from "@/components/teacher/TeacherWorkspaceClient";
import type { TeacherWorkspaceSnapshot } from "@/lib/teacher/types";
import type { CourseOverview } from "@/lib/server/data";

async function readWorkspaceError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}));
  if (typeof payload?.error === "string" && payload.error.length > 0) {
    return payload.error;
  }
  return fallback;
}

type TeacherWorkspaceRouteShellProps = {
  basePath?: "/teach" | "/admin/teach";
  courseCatalog?: CourseOverview[];
};

export default function TeacherWorkspaceRouteShell({
  basePath = "/admin/teach",
  courseCatalog = [],
}: TeacherWorkspaceRouteShellProps) {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => searchParams.toString(), [searchParams]);
  const initialQueryRef = useRef(initialQuery);
  const didBootstrapRef = useRef(false);
  const [workspace, setWorkspace] = useState<TeacherWorkspaceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const query = initialQueryRef.current;
      const response = await fetch(
        `/api/teach/workspace${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          await readWorkspaceError(response, "Unable to load teacher workspace."),
        );
      }

      const data = (await response.json()) as TeacherWorkspaceSnapshot;
      setWorkspace({
        ...data,
        assignments: Array.isArray(data.assignments) ? data.assignments : [],
        assignmentAnalytics: data.assignmentAnalytics ?? {
          totalAssignments: 0,
          recentAssignments24h: 0,
          assignedClassCount: 0,
          byTarget: { CLASS: 0, NEEDS_PRACTICE: 0 },
          byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
        },
      });
    } catch (cause) {
      const message =
        cause instanceof Error && cause.name === "AbortError"
          ? "Teacher workspace is taking too long to load."
          : cause instanceof Error
            ? cause.message
            : "Unable to load teacher workspace.";
      setError(message);
    } finally {
      clearTimeout(timer);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }
    didBootstrapRef.current = true;
    void loadWorkspace();
  }, [loadWorkspace]);

  if (isLoading && !workspace) {
    return (
      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm">
        <div className="mb-5 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-24 animate-pulse rounded-full bg-amber-100"
            />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-amber-100 bg-amber-50/70"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!workspace) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">
          {error ?? "Unable to load teacher workspace."}
        </p>
        <button
          type="button"
          onClick={() => void loadWorkspace()}
          className="mt-4 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <>
      {workspace.isFallbackData && (
        <p className="mb-4 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          Data may be delayed. Showing fallback classroom data while the database reconnects.
        </p>
      )}
      <TeacherWorkspaceClient
        initialWorkspace={workspace}
        basePath={basePath}
        courseCatalog={courseCatalog}
      />
    </>
  );
}
