"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TeacherWorkspaceClient from "@/components/teacher/TeacherWorkspaceClient";
import type { CourseOverview } from "@/lib/server/data";
import type { TeacherWorkspaceSnapshot } from "@/lib/teacher/types";

const WORKSPACE_SESSION_STORAGE_KEY_PREFIX = "teacher-workspace-snapshot";

const getWorkspaceStorageKey = (basePath: "/teach" | "/admin/teach") =>
  `${WORKSPACE_SESSION_STORAGE_KEY_PREFIX}:${basePath}`;

const readCachedWorkspace = (
  basePath: "/teach" | "/admin/teach",
): TeacherWorkspaceSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getWorkspaceStorageKey(basePath));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as TeacherWorkspaceSnapshot;
  } catch {
    return null;
  }
};

const writeCachedWorkspace = (
  basePath: "/teach" | "/admin/teach",
  workspace: TeacherWorkspaceSnapshot,
) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getWorkspaceStorageKey(basePath),
      JSON.stringify(workspace),
    );
  } catch {
    // Ignore storage failures and keep runtime state only.
  }
};

const mergeWorkspaceSnapshot = (
  current: TeacherWorkspaceSnapshot | null,
  incoming: TeacherWorkspaceSnapshot,
): TeacherWorkspaceSnapshot => {
  if (!current || !incoming.isPartialData) {
    return incoming;
  }

  const hasCurrentStatuses = Object.keys(current.sessionStatuses ?? {}).length > 0;
  const hasCurrentAssignments = (current.assignments ?? []).length > 0;
  const hasCurrentAssignmentAnalytics =
    current.assignmentAnalytics?.totalAssignments > 0 ||
    current.assignmentAnalytics?.assignedClassCount > 0 ||
    current.assignmentAnalytics?.recentAssignments24h > 0;

  return {
    ...incoming,
    sessionStatuses: hasCurrentStatuses
      ? current.sessionStatuses
      : incoming.sessionStatuses,
    assignments: hasCurrentAssignments ? current.assignments : incoming.assignments,
    assignmentAnalytics: hasCurrentAssignmentAnalytics
      ? current.assignmentAnalytics
      : incoming.assignmentAnalytics,
  };
};

const emptyAssignmentAnalytics = () => ({
  totalAssignments: 0,
  recentAssignments24h: 0,
  assignedClassCount: 0,
  byTarget: { CLASS: 0, NEEDS_PRACTICE: 0 },
  byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
});

const normalizeWorkspaceSnapshot = (
  current: TeacherWorkspaceSnapshot | null,
  incoming: TeacherWorkspaceSnapshot,
) =>
  mergeWorkspaceSnapshot(current, {
    ...incoming,
    assignments: Array.isArray(incoming.assignments) ? incoming.assignments : [],
    assignmentAnalytics: incoming.assignmentAnalytics ?? emptyAssignmentAnalytics(),
  });

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
  const initialCachedWorkspaceRef = useRef<TeacherWorkspaceSnapshot | null>(
    readCachedWorkspace(basePath),
  );
  const workspaceRef = useRef<TeacherWorkspaceSnapshot | null>(
    initialCachedWorkspaceRef.current,
  );
  const detailRequestIdRef = useRef(0);
  const detailHydrationInFlightRef = useRef(false);
  const [workspace, setWorkspace] = useState<TeacherWorkspaceSnapshot | null>(
    () => initialCachedWorkspaceRef.current,
  );
  const [resolvedCourseCatalog, setResolvedCourseCatalog] =
    useState<CourseOverview[]>(courseCatalog);
  const [isLoading, setIsLoading] = useState(
    () => initialCachedWorkspaceRef.current === null,
  );
  const [isHydratingDetails, setIsHydratingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  const buildWorkspaceUrl = useCallback((detailLevel: "core" | "full") => {
    const query = new URLSearchParams(initialQueryRef.current);
    if (detailLevel === "core") {
      query.set("detail", "core");
    } else {
      query.delete("detail");
    }
    const serialized = query.toString();
    return `/api/teach/workspace${serialized ? `?${serialized}` : ""}`;
  }, []);

  const buildWorkspaceDetailsUrl = useCallback(
    (type: "session-statuses" | "assignments") => {
      const query = new URLSearchParams(initialQueryRef.current);
      const serialized = query.toString();
      return `/api/teach/workspace/${type}${serialized ? `?${serialized}` : ""}`;
    },
    [],
  );

  const mergeWorkspacePatch = useCallback(
    (patch: Partial<TeacherWorkspaceSnapshot>) => {
      const nextWorkspace = {
        ...(workspaceRef.current ?? {}),
        ...patch,
      } as TeacherWorkspaceSnapshot;
      writeCachedWorkspace(basePath, nextWorkspace);
      workspaceRef.current = nextWorkspace;
      setWorkspace(nextWorkspace);
    },
    [basePath],
  );

  const loadWorkspaceDetails = useCallback(async () => {
    if (detailHydrationInFlightRef.current) {
      return;
    }

    const detailRequestId = ++detailRequestIdRef.current;
    let pendingRequests = 2;

    detailHydrationInFlightRef.current = true;
    setIsHydratingDetails(true);

    const settle = () => {
      if (detailRequestId !== detailRequestIdRef.current) {
        return;
      }
      pendingRequests -= 1;
      if (pendingRequests > 0) {
        return;
      }
      detailHydrationInFlightRef.current = false;
      setIsHydratingDetails(false);
      if (workspaceRef.current?.isPartialData) {
        mergeWorkspacePatch({ isPartialData: false });
      }
    };

    void fetch(buildWorkspaceDetailsUrl("session-statuses"), {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok || detailRequestId !== detailRequestIdRef.current) {
          return;
        }
        const data = (await response.json()) as Pick<
          TeacherWorkspaceSnapshot,
          "sessionStatuses"
        >;
        mergeWorkspacePatch({
          sessionStatuses: data.sessionStatuses ?? {},
        });
      })
      .catch(() => {
        // Keep the lighter workspace snapshot if session hydration fails.
      })
      .finally(settle);

    void fetch(buildWorkspaceDetailsUrl("assignments"), {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok || detailRequestId !== detailRequestIdRef.current) {
          return;
        }
        const data = (await response.json()) as Pick<
          TeacherWorkspaceSnapshot,
          "assignments" | "assignmentAnalytics"
        >;
        mergeWorkspacePatch({
          assignments: Array.isArray(data.assignments) ? data.assignments : [],
          assignmentAnalytics:
            data.assignmentAnalytics ?? emptyAssignmentAnalytics(),
        });
      })
      .catch(() => {
        // Keep the lighter workspace snapshot if assignment hydration fails.
      })
      .finally(settle);
  }, [buildWorkspaceDetailsUrl, mergeWorkspacePatch]);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    detailRequestIdRef.current += 1;
    detailHydrationInFlightRef.current = false;
    setIsHydratingDetails(false);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(buildWorkspaceUrl("core"), {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          await readWorkspaceError(response, "Unable to load teacher workspace."),
        );
      }

      const data = (await response.json()) as TeacherWorkspaceSnapshot;
      const nextWorkspace = normalizeWorkspaceSnapshot(workspaceRef.current, data);
      mergeWorkspacePatch(nextWorkspace);

      if (data.isPartialData) {
        void loadWorkspaceDetails();
      }
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
  }, [buildWorkspaceUrl, loadWorkspaceDetails, mergeWorkspacePatch]);

  const loadCourseCatalog = useCallback(async () => {
    try {
      const response = await fetch("/api/teach/course-catalog", {
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as CourseOverview[];
      if (!Array.isArray(data) || data.length === 0) {
        return;
      }

      setResolvedCourseCatalog(data);
    } catch {
      // Keep the instant local catalog when live refresh fails.
    }
  }, []);

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }
    didBootstrapRef.current = true;
    void loadWorkspace();
    void loadCourseCatalog();
  }, [loadCourseCatalog, loadWorkspace]);

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
      {workspace.isPartialData && !workspace.isFallbackData && (
        <p className="mb-4 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
          Refreshing live session details in the background.
        </p>
      )}
      <TeacherWorkspaceClient
        initialWorkspace={workspace}
        basePath={basePath}
        courseCatalog={resolvedCourseCatalog}
      />
      {isHydratingDetails && (
        <p className="mt-3 text-xs font-medium text-slate-500">
          Syncing assignments and session signals...
        </p>
      )}
    </>
  );
}
