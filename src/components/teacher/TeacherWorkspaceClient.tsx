"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { CourseOverview } from "@/lib/server/data";
import type {
  LearnerProgressStatus,
  TeacherActivity,
  TeacherClassroom,
  TeacherStrand,
  TeacherWorkspaceSnapshot,
} from "@/lib/teacher/types";

type TeacherWorkspaceClientProps = {
  initialWorkspace: TeacherWorkspaceSnapshot;
  initialTab?: WorkspaceTab;
  basePath?: "/teach" | "/admin/teach";
  courseCatalog?: CourseOverview[];
};

export type WorkspaceTab = "teach" | "learners" | "progress" | "settings";

type ClassFormState = {
  name: string;
  grade: string;
  teacherName: string;
  teacherPhone: string;
  acceptDeviceTerms: boolean;
  acceptDataPolicy: boolean;
};

type EditClassFormState = {
  name: string;
  grade: string;
  teacherName: string;
  teacherPhone: string;
};

type LearnersList = TeacherWorkspaceSnapshot["learners"];

type AlignmentMatch = {
  courseId: string;
  reason: string;
};

const STATUS_META: Record<
  LearnerProgressStatus,
  { label: string; chipClass: string; pillClass: string }
> = {
  PRACTICED_ENOUGH: {
    label: "Practiced enough",
    chipClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pillClass: "bg-emerald-50 border-emerald-200",
  },
  KEEP_GOING: {
    label: "Keep going",
    chipClass: "bg-sky-100 text-sky-800 border-sky-200",
    pillClass: "bg-sky-50 border-sky-200",
  },
  NEED_MORE_PRACTICE: {
    label: "Need more practice",
    chipClass: "bg-amber-100 text-amber-900 border-amber-200",
    pillClass: "bg-amber-50 border-amber-200",
  },
};

const DEFAULT_CLASS_FORM: ClassFormState = {
  name: "",
  grade: "",
  teacherName: "",
  teacherPhone: "",
  acceptDeviceTerms: false,
  acceptDataPolicy: false,
};

const tabButtonClass =
  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition";

const TAB_LABELS: Record<WorkspaceTab, string> = {
  teach: "Teach",
  learners: "Learners",
  progress: "Progress",
  settings: "Settings",
};

const tabLinkClass = (active: boolean, mobile = false) =>
  mobile
    ? `rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`
    : `${tabButtonClass} ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`;

const avatarFromHue = (hue: number) => ({
  backgroundColor: `hsl(${hue} 70% 88%)`,
  color: `hsl(${hue} 48% 24%)`,
});

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const ACTIVITY_ALIGNMENT_MAP: Record<string, AlignmentMatch[]> = {
  "activity-sorting-grouping": [
    {
      courseId: "course-logic",
      reason: "Direct match for classification, patterns, and sorting thinking.",
    },
    {
      courseId: "course-math",
      reason: "Supports early rule-following and sequencing before robot math tasks.",
    },
  ],
  "activity-matching-pairing": [
    {
      courseId: "course-logic",
      reason: "Builds pattern recognition used in AI Pattern Detectives missions.",
    },
  ],
  "activity-ordering": [
    {
      courseId: "course-logic",
      reason: "Supports sequencing and condition-block thinking in beginner coding tasks.",
    },
    {
      courseId: "course-math",
      reason: "Prepares learners for ordered robot steps and debug routines.",
    },
  ],
  "activity-patterns": [
    {
      courseId: "course-logic",
      reason: "Strongest match for patterns + counting in the Explorer mission path.",
    },
  ],
};

const STRAND_ALIGNMENT_MAP: Record<string, AlignmentMatch[]> = {
  "strand-pre-number": [
    {
      courseId: "course-logic",
      reason: "Pre-number foundations feed pattern spotting and classifier thinking.",
    },
  ],
  "strand-numbers": [
    {
      courseId: "course-math",
      reason: "Number fluency supports coordinates, probability, and robot controls.",
    },
  ],
  "strand-measurement": [
    {
      courseId: "course-math",
      reason: "Measurement concepts reinforce robot movement and quantitative reasoning.",
    },
  ],
  "strand-geometry": [
    {
      courseId: "course-math",
      reason: "Geometry connects to coordinates and navigation in robot missions.",
    },
  ],
  "strand-listening-speaking": [
    {
      courseId: "course-story",
      reason: "Language fluency supports prompt design and chatbot interaction practice.",
    },
  ],
  "strand-reading": [
    {
      courseId: "course-story",
      reason: "Reading strengthens prompt interpretation and response quality checks.",
    },
  ],
  "strand-writing": [
    {
      courseId: "course-story",
      reason: "Writing skills align with storytelling chatbot prompts and revisions.",
    },
  ],
};

const SUBJECT_ALIGNMENT_MAP: Record<string, AlignmentMatch[]> = {
  "subject-math": [
    {
      courseId: "course-math",
      reason: "Math subject work maps to the Builder mission path.",
    },
    {
      courseId: "course-logic",
      reason: "Foundational math patterns also support AI Pattern Detectives.",
    },
  ],
  "subject-language": [
    {
      courseId: "course-story",
      reason: "Language strands align with the Creator chatbot storytelling mission.",
    },
  ],
};

const uniqueAlignment = (matches: AlignmentMatch[]) => {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (seen.has(match.courseId)) return false;
    seen.add(match.courseId);
    return true;
  });
};

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}));
  if (typeof payload?.error === "string" && payload.error.length > 0) {
    return payload.error;
  }
  return fallback;
}

export default function TeacherWorkspaceClient({
  initialWorkspace,
  initialTab = "teach",
  basePath = "/admin/teach",
  courseCatalog = [],
}: TeacherWorkspaceClientProps) {
  const pathname = usePathname();
  const [workspace, setWorkspace] = useState<TeacherWorkspaceSnapshot>(
    initialWorkspace,
  );
  const activeTab = useMemo<WorkspaceTab>(() => {
    if (pathname?.endsWith("/learners")) return "learners";
    if (pathname?.endsWith("/progress")) return "progress";
    if (pathname?.endsWith("/settings")) return "settings";
    if (pathname?.endsWith("/teach")) return "teach";
    return initialTab;
  }, [pathname, initialTab]);
  const tabRoutes = useMemo<Record<WorkspaceTab, string>>(
    () => ({
      teach: basePath,
      learners: `${basePath}/learners`,
      progress: `${basePath}/progress`,
      settings: `${basePath}/settings`,
    }),
    [basePath],
  );
  const [activeClassId, setActiveClassId] = useState<string | null>(
    initialWorkspace.activeClassId,
  );
  const [activeSubjectId, setActiveSubjectId] = useState<string>(
    initialWorkspace.subjects[0]?.id ?? "subject-math",
  );
  const [activeStrandId, setActiveStrandId] = useState<string>(
    initialWorkspace.strands.find((item) => item.subjectId === activeSubjectId)
      ?.id ?? initialWorkspace.strands[0]?.id ?? "",
  );
  const [activeActivityId, setActiveActivityId] = useState<string | null>(
    initialWorkspace.sessionActivityId,
  );
  const [showAddClass, setShowAddClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [addClassForm, setAddClassForm] =
    useState<ClassFormState>(DEFAULT_CLASS_FORM);
  const [addLearnerName, setAddLearnerName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isWorkspaceRefreshing, setIsWorkspaceRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshRequestIdRef = useRef(0);
  const workspaceRefreshInFlightRef = useRef(false);

  const activeClass = useMemo(
    () =>
      workspace.classes.find((item) => item.id === activeClassId) ??
      workspace.classes[0] ??
      null,
    [workspace.classes, activeClassId],
  );

  const editClassForm = useMemo<EditClassFormState>(
    () => ({
      name: activeClass?.name ?? "",
      grade: activeClass?.grade ?? "",
      teacherName: activeClass?.teacherName ?? "",
      teacherPhone: activeClass?.teacherPhone ?? "",
    }),
    [activeClass],
  );
  const [editFormState, setEditFormState] =
    useState<EditClassFormState>(editClassForm);

  const subjectOptions = workspace.subjects;
  const strandOptions = useMemo(
    () =>
      workspace.strands.filter((item) => item.subjectId === activeSubjectId),
    [workspace.strands, activeSubjectId],
  );
  const activityOptions = useMemo(
    () =>
      workspace.activities.filter(
        (item) => item.subjectId === activeSubjectId && item.strandId === activeStrandId,
      ),
    [workspace.activities, activeSubjectId, activeStrandId],
  );

  const selectedActivity =
    activityOptions.find((item) => item.id === activeActivityId) ??
    activityOptions[0] ??
    null;

  const selectedStrand = strandOptions.find((item) => item.id === activeStrandId) ?? null;
  const selectedSubject =
    subjectOptions.find((item) => item.id === activeSubjectId) ?? null;

  const alignedCourseMatches = useMemo(() => {
    const matches = uniqueAlignment([
      ...(selectedActivity ? (ACTIVITY_ALIGNMENT_MAP[selectedActivity.id] ?? []) : []),
      ...(activeStrandId ? (STRAND_ALIGNMENT_MAP[activeStrandId] ?? []) : []),
      ...(activeSubjectId ? (SUBJECT_ALIGNMENT_MAP[activeSubjectId] ?? []) : []),
    ]);

    return matches
      .map((match) => ({
        ...match,
        course: courseCatalog.find((course) => course.id === match.courseId) ?? null,
      }))
      .filter(
        (
          item,
        ): item is AlignmentMatch & { course: CourseOverview } => item.course !== null,
      );
  }, [activeStrandId, activeSubjectId, courseCatalog, selectedActivity]);

  const readOnlyAlignmentPanel =
    selectedActivity && alignedCourseMatches.length > 0 ? (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Curriculum alignment
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {selectedSubject?.name ?? "Subject"} / {selectedStrand?.name ?? "Strand"} /{" "}
            {selectedActivity.title}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Learner mission mapping for the current teaching activity.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {alignedCourseMatches.map(({ course, reason }, index) => (
            <article
              key={`${course.id}-readonly-${index}`}
              className="rounded-xl border border-white bg-white p-3"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {course.ageBand && (
                  <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-800">
                    Ages {course.ageBand}
                  </span>
                )}
                {course.pathwayStage && (
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-800">
                    {course.pathwayStage}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{course.title}</p>
              <p className="mt-1 text-xs text-slate-600">{reason}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                {course.aiFocus && (
                  <p>
                    <span className="font-semibold text-slate-800">AI:</span>{" "}
                    {course.aiFocus}
                  </p>
                )}
                {course.codingFocus && (
                  <p>
                    <span className="font-semibold text-slate-800">Coding:</span>{" "}
                    {course.codingFocus}
                  </p>
                )}
                {course.mathFocus && (
                  <p>
                    <span className="font-semibold text-slate-800">Maths:</span>{" "}
                    {course.mathFocus}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    ) : null;

  const statusBuckets = useMemo(() => {
    const grouped: Record<LearnerProgressStatus, LearnersList> = {
      PRACTICED_ENOUGH: [],
      KEEP_GOING: [],
      NEED_MORE_PRACTICE: [],
    };

    workspace.learners.forEach((learner) => {
      const status =
        workspace.sessionStatuses[learner.id] ?? ("KEEP_GOING" as const);
      grouped[status].push(learner);
    });
    return grouped;
  }, [workspace.learners, workspace.sessionStatuses]);

  const weeklyTotal = workspace.weeklySummary.thisWeekMinutes;
  const lastWeekTotal = workspace.weeklySummary.lastWeekMinutes;
  const weekShare = weeklyTotal + lastWeekTotal === 0
    ? 0
    : Math.round((weeklyTotal / (weeklyTotal + lastWeekTotal)) * 100);

  const tabHref = (tab: WorkspaceTab) => {
    const params = new URLSearchParams();
    if (activeClassId) {
      params.set("classId", activeClassId);
    }
    if (activeSubjectId) {
      params.set("subjectId", activeSubjectId);
    }
    if (activeStrandId) {
      params.set("strandId", activeStrandId);
    }
    if (activeActivityId) {
      params.set("activityId", activeActivityId);
    }
    const query = params.toString();
    return query ? `${tabRoutes[tab]}?${query}` : tabRoutes[tab];
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();
    if (activeClassId) {
      params.set("classId", activeClassId);
    }
    if (activeSubjectId) {
      params.set("subjectId", activeSubjectId);
    }
    if (activeStrandId) {
      params.set("strandId", activeStrandId);
    }
    if (activeActivityId) {
      params.set("activityId", activeActivityId);
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl =
      window.location.pathname + (window.location.search || "");

    if (nextUrl !== currentUrl) {
      // Avoid mutating Next.js router-managed history state object directly.
      window.history.replaceState(null, "", nextUrl);
    }
  }, [
    pathname,
    activeClassId,
    activeSubjectId,
    activeStrandId,
    activeActivityId,
  ]);

  async function refreshWorkspace(next?: {
    classId?: string | null;
    subjectId?: string;
    strandId?: string;
    activityId?: string | null;
  }) {
    const requestId = ++refreshRequestIdRef.current;
    const query = new URLSearchParams();
    const classId = next?.classId ?? activeClassId;
    const subjectId = next?.subjectId ?? activeSubjectId;
    const strandId = next?.strandId ?? activeStrandId;
    const activityId = next?.activityId ?? activeActivityId;

    if (classId) {
      query.set("classId", classId);
    }
    if (subjectId) {
      query.set("subjectId", subjectId);
    }
    if (strandId) {
      query.set("strandId", strandId);
    }
    if (activityId) {
      query.set("activityId", activityId);
    }

    workspaceRefreshInFlightRef.current = true;
    setIsWorkspaceRefreshing(true);
    try {
      const response = await fetch(`/api/teach/workspace?${query.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to load workspace."));
      }

      const data = (await response.json()) as TeacherWorkspaceSnapshot;
      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      setWorkspace(data);
      setActiveClassId(data.activeClassId);

      if (!data.subjects.some((item) => item.id === subjectId)) {
        const fallbackSubjectId = data.subjects[0]?.id ?? activeSubjectId;
        setActiveSubjectId(fallbackSubjectId);
      }

      const nextStrands = data.strands.filter(
        (item) => item.subjectId === (next?.subjectId ?? subjectId),
      );
      if (!nextStrands.some((item) => item.id === strandId)) {
        setActiveStrandId(nextStrands[0]?.id ?? "");
      }

      const nextActivities = data.activities.filter(
        (item) =>
          item.subjectId === (next?.subjectId ?? subjectId) &&
          item.strandId === (next?.strandId ?? strandId),
      );
      if (!nextActivities.some((item) => item.id === activityId)) {
        setActiveActivityId(nextActivities[0]?.id ?? null);
      } else {
        setActiveActivityId(activityId ?? null);
      }
    } finally {
      if (requestId === refreshRequestIdRef.current) {
        workspaceRefreshInFlightRef.current = false;
        setIsWorkspaceRefreshing(false);
      }
    }
  }

  async function onClassSwitch(classId: string) {
    if (workspaceRefreshInFlightRef.current) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await refreshWorkspace({ classId });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load workspace.",
      );
    }
  }

  function onSubjectSwitch(subjectId: string) {
    if (workspaceRefreshInFlightRef.current) {
      return;
    }
    const strands = workspace.strands.filter((item) => item.subjectId === subjectId);
    const nextStrandId = strands[0]?.id ?? "";
    const activities = workspace.activities.filter(
      (item) => item.subjectId === subjectId && item.strandId === nextStrandId,
    );
    const nextActivityId = activities[0]?.id ?? null;

    setActiveSubjectId(subjectId);
    setActiveStrandId(nextStrandId);
    setActiveActivityId(nextActivityId);
    void refreshWorkspace({
      subjectId,
      strandId: nextStrandId,
      activityId: nextActivityId,
    }).catch((loadError) =>
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load workspace.",
      ),
    );
  }

  function onStrandSwitch(strand: TeacherStrand) {
    if (workspaceRefreshInFlightRef.current) {
      return;
    }
    const activities = workspace.activities.filter(
      (item) =>
        item.subjectId === activeSubjectId && item.strandId === strand.id,
    );
    const nextActivityId = activities[0]?.id ?? null;
    setActiveStrandId(strand.id);
    setActiveActivityId(nextActivityId);
    void refreshWorkspace({
      strandId: strand.id,
      activityId: nextActivityId,
    }).catch((loadError) =>
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load workspace.",
      ),
    );
  }

  function onActivitySwitch(activity: TeacherActivity) {
    if (workspaceRefreshInFlightRef.current) {
      return;
    }
    setActiveActivityId(activity.id);
    void refreshWorkspace({ activityId: activity.id }).catch((loadError) =>
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load workspace.",
      ),
    );
  }

  async function submitAddClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/teach/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addClassForm),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to add class."));
      }

      const payload = (await response.json()) as { classroom: TeacherClassroom };
      setAddClassForm(DEFAULT_CLASS_FORM);
      setShowAddClass(false);
      setActiveClassId(payload.classroom.id);
      setNotice(`Class ${payload.classroom.grade} created.`);
      await refreshWorkspace({ classId: payload.classroom.id });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to add class.");
    } finally {
      setIsPending(false);
    }
  }

  async function submitEditClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeClass) {
      return;
    }

    setIsPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/teach/class/${activeClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ...editFormState,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to update class."));
      }

      setShowEditClass(false);
      setNotice("Class details updated.");
      await refreshWorkspace({ classId: activeClass.id });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to update class.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function archiveCurrentClass() {
    if (!activeClass) {
      return;
    }

    setIsPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/teach/class/${activeClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to archive class."));
      }

      setShowEditClass(false);
      setNotice(`${activeClass.name} moved to deleted classes.`);
      await refreshWorkspace();
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to archive class.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function restoreClass(classId: string) {
    setIsPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/teach/class/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to restore class."));
      }

      setNotice("Class restored.");
      await refreshWorkspace({ classId });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to restore class.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function submitLearner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeClassId || !addLearnerName.trim()) {
      return;
    }

    setIsPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/teach/class/${activeClassId}/learner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addLearnerName }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to add learner."));
      }
      setAddLearnerName("");
      setNotice("Learner added.");
      await refreshWorkspace({ classId: activeClassId });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to add learner.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function advanceLearnerStatus(learnerId: string) {
    if (
      !activeClassId ||
      !selectedActivity ||
      workspaceRefreshInFlightRef.current
    ) {
      return;
    }

    setIsPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/teach/class/${activeClassId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          learnerId,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readError(response, "Unable to update learner status."),
        );
      }

      await refreshWorkspace({ classId: activeClassId, activityId: selectedActivity.id });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to update learner status.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {(notice || error) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? notice}
        </div>
      )}
      {isWorkspaceRefreshing && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800">
          Syncing workspace...
        </div>
      )}

      <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowQrCode((current) => !current)}
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800 transition hover:border-sky-300"
          >
            School QR code
          </button>
          <button
            type="button"
            onClick={() => setShowArchived((current) => !current)}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
          >
            Restore deleted classes ({workspace.archivedClasses.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setEditFormState(editClassForm);
              setShowEditClass(true);
            }}
            disabled={!activeClass}
            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit class
          </button>
        </div>

        {showQrCode && (
          <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
              School account QR
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {workspace.school.schoolQrCode}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Use this code to pair a device quickly with {workspace.school.schoolName}.
            </p>
          </div>
        )}

        {showArchived && (
          <div className="mb-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Deleted classes
            </p>
            {workspace.archivedClasses.length === 0 ? (
              <p className="text-sm text-slate-600">No deleted classes.</p>
            ) : (
              workspace.archivedClasses.map((classroom) => (
                <div
                  key={classroom.id}
                  className="flex items-center justify-between rounded-xl border border-white/80 bg-white px-3 py-2"
                >
                  <p className="text-sm text-slate-700">
                    {classroom.name} · {classroom.grade}
                  </p>
                  <button
                    type="button"
                    onClick={() => void restoreClass(classroom.id)}
                    disabled={isPending || isWorkspaceRefreshing}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {workspace.classes.map((classroom) => (
            <button
              key={classroom.id}
              type="button"
              onClick={() => void onClassSwitch(classroom.id)}
              disabled={isPending || isWorkspaceRefreshing}
              className={`rounded-2xl border p-4 text-left transition ${
                activeClassId === classroom.id
                  ? "border-slate-900 bg-white shadow-sm"
                  : "border-white/70 bg-white/80 hover:border-slate-200"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <div className={`rounded-xl px-3 py-2 ${classroom.cardColor}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {classroom.grade}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {classroom.name}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">{classroom.teacherName}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAddClass(true)}
            disabled={isPending || isWorkspaceRefreshing}
            className="grid place-items-center rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 p-4 text-center transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-2xl font-semibold text-white">
              +
            </span>
            <p className="mt-2 text-sm font-semibold text-slate-700">Add a class</p>
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm">
        <div className="mb-4 hidden flex-wrap gap-2 md:flex">
          {(Object.keys(tabRoutes) as WorkspaceTab[]).map((tab) => (
            <Link
              key={tab}
              href={tabHref(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={tabLinkClass(activeTab === tab)}
            >
              {TAB_LABELS[tab]}
            </Link>
          ))}
        </div>

        {activeTab === "teach" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onSubjectSwitch(subject.id)}
                  disabled={isPending || isWorkspaceRefreshing}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    subject.id === activeSubjectId
                      ? `bg-gradient-to-r ${subject.accentClass} text-white`
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {subject.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {strandOptions.map((strand) => (
                <button
                  key={strand.id}
                  type="button"
                  onClick={() => onStrandSwitch(strand)}
                  disabled={isPending || isWorkspaceRefreshing}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    strand.id === activeStrandId
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {strand.name}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {activityOptions.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => onActivitySwitch(activity)}
                  disabled={isPending || isWorkspaceRefreshing}
                  className={`rounded-2xl border p-4 text-left transition ${
                    activity.id === selectedActivity?.id
                      ? "border-slate-900 shadow-sm"
                      : "border-white/80"
                  } ${activity.cardClass} disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {activity.iconText}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {activity.title}
                  </p>
                </button>
              ))}
            </div>

            {selectedActivity && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                      Teaching session
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {selectedActivity.title}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                    {workspace.learners.length} learners
                  </span>
                </div>

                {alignedCourseMatches.length > 0 && (
                  <div className="mb-4 rounded-2xl border border-white/80 bg-white/80 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Curriculum alignment
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {selectedSubject?.name ?? "Subject"} / {selectedStrand?.name ?? "Strand"} /{" "}
                          {selectedActivity.title}
                        </p>
                      </div>
                      <Link
                        href="/courses"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                      >
                        Learner courses
                      </Link>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {alignedCourseMatches.map(({ course, reason }, index) => (
                        <article
                          key={`${course.id}-${index}`}
                          className="rounded-xl border border-slate-100 bg-white p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                            {course.ageBand && (
                              <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-800">
                                Ages {course.ageBand}
                              </span>
                            )}
                            {course.pathwayStage && (
                              <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-800">
                                {course.pathwayStage}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {course.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">{reason}</p>
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            {course.aiFocus && (
                              <p>
                                <span className="font-semibold text-slate-800">AI:</span>{" "}
                                {course.aiFocus}
                              </p>
                            )}
                            {course.codingFocus && (
                              <p>
                                <span className="font-semibold text-slate-800">Coding:</span>{" "}
                                {course.codingFocus}
                              </p>
                            )}
                            {course.mathFocus && (
                              <p>
                                <span className="font-semibold text-slate-800">Maths:</span>{" "}
                                {course.mathFocus}
                              </p>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/courses/${course.id}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                            >
                              Preview mission
                            </Link>
                            <Link
                              href={tabHref("teach")}
                              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:border-sky-300"
                            >
                              Stay in teach
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 lg:grid-cols-3">
                  {(Object.keys(STATUS_META) as LearnerProgressStatus[]).map((status) => (
                    <div
                      key={status}
                      className={`rounded-2xl border p-3 ${STATUS_META[status].pillClass}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {STATUS_META[status].label}
                      </p>
                      <div className="mt-3 space-y-2">
                        {statusBuckets[status].length === 0 ? (
                          <p className="text-xs text-slate-500">No learners</p>
                        ) : (
                          statusBuckets[status].map((learner) => (
                            <div
                              key={learner.id}
                              className="flex items-center justify-between rounded-xl border border-white/70 bg-white/80 px-3 py-2"
                            >
                              <p className="text-sm text-slate-700">{learner.name}</p>
                              <button
                                type="button"
                                onClick={() => void advanceLearnerStatus(learner.id)}
                                disabled={isPending || isWorkspaceRefreshing}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                Advance
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "learners" && (
          <div className="space-y-4">
            <header className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Class learners
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {activeClass?.name ?? "No class selected"}
              </h3>
            </header>

            {readOnlyAlignmentPanel}

            <form onSubmit={submitLearner} className="flex flex-wrap gap-2">
              <input
                value={addLearnerName}
                onChange={(event) => setAddLearnerName(event.target.value)}
                placeholder="Learner name"
                className="min-w-[220px] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                disabled={isPending || !activeClassId}
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Add learner
              </button>
            </form>

            <div className="space-y-2">
              {workspace.learners.length === 0 ? (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  No learners yet.
                </p>
              ) : (
                workspace.learners.map((learner, index) => (
                  <div
                    key={learner.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {index + 1}.
                      </span>
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                        style={avatarFromHue(learner.avatarHue)}
                      >
                        {initialsOf(learner.name)}
                      </span>
                      <p className="text-sm font-medium text-slate-900">{learner.name}</p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {learner.weeklyMinutes} mins
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-5">
            <header className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Weekly class progress
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {activeClass?.grade ?? ""} · {activeClass?.name ?? "Class"}
              </h3>
            </header>

            {readOnlyAlignmentPanel}

            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div
                  className="mx-auto grid h-36 w-36 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(rgb(34 197 94) ${
                      weekShare * 3.6
                    }deg, rgb(226 232 240) 0deg)`,
                  }}
                >
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      This week
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {weeklyTotal}m
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-slate-600">
                  Last week: {lastWeekTotal}m
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Learner usage
                </p>
                <div className="mt-3 space-y-2">
                  {workspace.learnerUsage.length === 0 ? (
                    <p className="text-sm text-slate-600">No usage data yet.</p>
                  ) : (
                    workspace.learnerUsage.map((item, index) => (
                      <div
                        key={item.learnerId}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                      >
                        <p className="text-sm text-slate-800">
                          {index + 1}. {item.learnerName}
                        </p>
                        <p className="text-xs font-semibold text-slate-600">
                          {item.thisWeekMinutes}m / {item.lastWeekMinutes}m
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <header className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                School account
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {workspace.school.schoolName}
              </h3>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Connectivity
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {workspace.school.connectivityStatus === "OKAY"
                    ? "Okay"
                    : "Limited"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Content status
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {workspace.school.contentStatus === "UP_TO_DATE"
                    ? "Up to date"
                    : "Syncing"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Version
                </p>
                <p className="mt-1 text-sm text-slate-800">{workspace.school.appVersion}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Device ID
                </p>
                <p className="mt-1 text-sm text-slate-800">{workspace.school.deviceId}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Need help? Contact{" "}
              <a
                href={`mailto:${workspace.school.supportEmail}`}
                className="font-semibold text-sky-700 underline decoration-sky-200"
              >
                {workspace.school.supportEmail}
              </a>
              .
            </p>
          </div>
        )}
      </section>

      {showAddClass && (
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Add a class</h3>
          <form onSubmit={submitAddClass} className="mt-4 space-y-3">
            <input
              value={addClassForm.grade}
              onChange={(event) =>
                setAddClassForm((current) => ({ ...current, grade: event.target.value }))
              }
              placeholder="Grade (e.g. PP1)"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <input
              value={addClassForm.name}
              onChange={(event) =>
                setAddClassForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Class name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <input
              value={addClassForm.teacherName}
              onChange={(event) =>
                setAddClassForm((current) => ({
                  ...current,
                  teacherName: event.target.value,
                }))
              }
              placeholder="Teacher name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <input
              value={addClassForm.teacherPhone}
              onChange={(event) =>
                setAddClassForm((current) => ({
                  ...current,
                  teacherPhone: event.target.value,
                }))
              }
              placeholder="Teacher phone number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={addClassForm.acceptDeviceTerms}
                onChange={(event) =>
                  setAddClassForm((current) => ({
                    ...current,
                    acceptDeviceTerms: event.target.checked,
                  }))
                }
                className="mt-1"
              />
              I acknowledge receiving a learning device and accept liability for loss
              or damage.
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={addClassForm.acceptDataPolicy}
                onChange={(event) =>
                  setAddClassForm((current) => ({
                    ...current,
                    acceptDataPolicy: event.target.checked,
                  }))
                }
                className="mt-1"
              />
              I have read and understood the terms of the Data Usage Policy.
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Confirm class
              </button>
              <button
                type="button"
                onClick={() => setShowAddClass(false)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditClass && activeClass && (
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Edit class</h3>
          <form onSubmit={submitEditClass} className="mt-4 space-y-3">
            <input
              value={editFormState.grade}
              onChange={(event) =>
                setEditFormState((current) => ({ ...current, grade: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <input
              value={editFormState.name}
              onChange={(event) =>
                setEditFormState((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <input
              value={editFormState.teacherName}
              onChange={(event) =>
                setEditFormState((current) => ({
                  ...current,
                  teacherName: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <input
              value={editFormState.teacherPhone}
              onChange={(event) =>
                setEditFormState((current) => ({
                  ...current,
                  teacherPhone: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => void archiveCurrentClass()}
                disabled={isPending}
                className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Delete class
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditClass(false);
                  setEditFormState(editClassForm);
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {(Object.keys(tabRoutes) as WorkspaceTab[]).map((tab) => (
            <Link
              key={tab}
              href={tabHref(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
              className={tabLinkClass(activeTab === tab, true)}
            >
              {TAB_LABELS[tab]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
