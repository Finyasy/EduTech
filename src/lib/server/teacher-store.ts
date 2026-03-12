import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/server/prisma";
import {
  clearScopeDegraded,
  isScopeDegraded,
  markScopeDegraded,
} from "@/lib/server/degraded-mode";
import type {
  LearnerProgressStatus,
  TeacherAssignmentAnalytics,
  TeacherActivity,
  TeacherClassroom,
  TeacherLearner,
  TeacherMissionAssignment,
  TeacherSchoolSettings,
  TeacherStrand,
  TeacherSubject,
  TeacherWorkspaceSnapshot,
} from "@/lib/teacher/types";

type WorkspaceQuery = {
  ownerKey: string;
  classId?: string;
  subjectId?: string;
  strandId?: string;
  activityId?: string;
};

type WorkspaceDetailLevel = "core" | "full";

type AddClassInput = {
  name: string;
  grade: string;
  teacherName: string;
  teacherPhone: string;
  acceptDeviceTerms: boolean;
  acceptDataPolicy: boolean;
};

type UpdateClassInput = {
  name?: string;
  grade?: string;
  teacherName?: string;
  teacherPhone?: string;
};

type AddLearnerInput = {
  name: string;
};

type TeacherAssignmentAnalyticsFilters = {
  ownerKey?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  classId?: string;
  target?: "CLASS" | "NEEDS_PRACTICE";
};

export type TeacherAssignmentAnalyticsReport = {
  filters: {
    ownerKey: string | null;
    classId: string | null;
    target: "CLASS" | "NEEDS_PRACTICE" | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  summary: TeacherAssignmentAnalytics;
  byClass: Array<{
    classId: string;
    className: string;
    totalAssignments: number;
    practiceAssignments: number;
    classAssignments: number;
  }>;
  byDay: Array<{
    date: string;
    totalAssignments: number;
    practiceAssignments: number;
    classAssignments: number;
  }>;
};

const TEACHER_WORKSPACE_QUERY_TIMEOUT_MS = 4_000;
const TEACHER_WORKSPACE_DETAIL_QUERY_TIMEOUT_MS = 2_500;
const TEACHER_WORKSPACE_CACHE_TTL_MS = 5_000;
const TEACHER_WORKSPACE_CACHE_STALE_TTL_MS =
  process.env.NODE_ENV === "development"
    ? 30 * 60 * 1000
    : 5 * 60 * 1000;
const TEACHER_WRITE_MAX_WAIT_MS = 700;
const TEACHER_WRITE_STATEMENT_TIMEOUT_MS = 1_200;
const TEACHER_WRITE_TRANSACTION_TIMEOUT_MS = 1_500;
const TEACHER_WRITE_QUERY_TIMEOUT_MS = 1_800;
const TEACHER_WORKSPACE_DEGRADED_SCOPE = "teacher-workspace";
const ENABLE_WORKSPACE_CACHE = process.env.NODE_ENV !== "test";

const withTeacherWorkspaceTimeout = <T,>(promise: Promise<T>) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Teacher workspace query timed out")),
        TEACHER_WORKSPACE_QUERY_TIMEOUT_MS,
      ),
    ),
  ]);

const withTeacherWorkspaceDetailTimeout = <T,>(promise: Promise<T>) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Teacher workspace detail query timed out")),
        TEACHER_WORKSPACE_DETAIL_QUERY_TIMEOUT_MS,
      ),
    ),
  ]);

const withTeacherWriteTimeout = <T,>(promise: Promise<T>) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Teacher write query timed out")),
        TEACHER_WRITE_QUERY_TIMEOUT_MS,
      ),
    ),
  ]);

type TeacherStoreDbClient =
  | Prisma.TransactionClient
  | NonNullable<ReturnType<typeof getPrisma>>;

async function runTeacherWriteTransaction<T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Persistent teacher store unavailable.");
  }

  return withTeacherWriteTimeout(
    prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          `SET LOCAL statement_timeout = ${TEACHER_WRITE_STATEMENT_TIMEOUT_MS}`,
        );
        return action(tx);
      },
      {
        maxWait: TEACHER_WRITE_MAX_WAIT_MS,
        timeout: TEACHER_WRITE_TRANSACTION_TIMEOUT_MS,
      },
    ),
  );
}

const SUBJECTS: TeacherSubject[] = [
  {
    id: "subject-math",
    name: "Mathematics",
    accentClass: "from-indigo-500 to-violet-600",
  },
  {
    id: "subject-language",
    name: "Language",
    accentClass: "from-fuchsia-500 to-pink-500",
  },
];

const STRANDS: TeacherStrand[] = [
  { id: "strand-pre-number", subjectId: "subject-math", name: "Pre-Number" },
  { id: "strand-numbers", subjectId: "subject-math", name: "Numbers" },
  { id: "strand-measurement", subjectId: "subject-math", name: "Measurement" },
  { id: "strand-geometry", subjectId: "subject-math", name: "Geometry" },
  {
    id: "strand-listening-speaking",
    subjectId: "subject-language",
    name: "Listening & Speaking",
  },
  { id: "strand-reading", subjectId: "subject-language", name: "Reading" },
  { id: "strand-writing", subjectId: "subject-language", name: "Writing" },
];

const ACTIVITIES: TeacherActivity[] = [
  {
    id: "activity-sorting-grouping",
    subjectId: "subject-math",
    strandId: "strand-pre-number",
    title: "Sorting and grouping",
    iconText: "◍",
    cardClass: "bg-sky-100 border-sky-200",
  },
  {
    id: "activity-matching-pairing",
    subjectId: "subject-math",
    strandId: "strand-pre-number",
    title: "Matching and pairing",
    iconText: "◎",
    cardClass: "bg-amber-100 border-amber-200",
  },
  {
    id: "activity-ordering",
    subjectId: "subject-math",
    strandId: "strand-pre-number",
    title: "Ordering",
    iconText: "≡",
    cardClass: "bg-yellow-100 border-yellow-200",
  },
  {
    id: "activity-patterns",
    subjectId: "subject-math",
    strandId: "strand-pre-number",
    title: "Patterns",
    iconText: "▥",
    cardClass: "bg-rose-100 border-rose-200",
  },
  {
    id: "activity-number-recognition",
    subjectId: "subject-math",
    strandId: "strand-numbers",
    title: "Number recognition",
    iconText: "123",
    cardClass: "bg-indigo-100 border-indigo-200",
  },
  {
    id: "activity-number-sequencing",
    subjectId: "subject-math",
    strandId: "strand-numbers",
    title: "Number sequencing",
    iconText: "↦",
    cardClass: "bg-violet-100 border-violet-200",
  },
  {
    id: "activity-number-writing",
    subjectId: "subject-math",
    strandId: "strand-numbers",
    title: "Number writing",
    iconText: "✎",
    cardClass: "bg-blue-100 border-blue-200",
  },
  {
    id: "activity-comparing-sizes",
    subjectId: "subject-math",
    strandId: "strand-measurement",
    title: "Comparing sizes",
    iconText: "↔",
    cardClass: "bg-teal-100 border-teal-200",
  },
  {
    id: "activity-length-estimation",
    subjectId: "subject-math",
    strandId: "strand-measurement",
    title: "Length estimation",
    iconText: "cm",
    cardClass: "bg-cyan-100 border-cyan-200",
  },
  {
    id: "activity-capacity-weight",
    subjectId: "subject-math",
    strandId: "strand-measurement",
    title: "Capacity and weight",
    iconText: "L/kg",
    cardClass: "bg-emerald-100 border-emerald-200",
  },
  {
    id: "activity-sides-of-objects",
    subjectId: "subject-math",
    strandId: "strand-geometry",
    title: "Sides of objects",
    iconText: "⬢",
    cardClass: "bg-emerald-100 border-emerald-200",
  },
  {
    id: "activity-shapes",
    subjectId: "subject-math",
    strandId: "strand-geometry",
    title: "Shapes",
    iconText: "△",
    cardClass: "bg-lime-100 border-lime-200",
  },
  {
    id: "activity-print-awareness",
    subjectId: "subject-language",
    strandId: "strand-reading",
    title: "Print awareness",
    iconText: "Aa",
    cardClass: "bg-stone-100 border-stone-200",
  },
  {
    id: "activity-letter-recognition",
    subjectId: "subject-language",
    strandId: "strand-reading",
    title: "Letter recognition",
    iconText: "ABC",
    cardClass: "bg-sky-100 border-sky-200",
  },
  {
    id: "activity-visual-discrimination",
    subjectId: "subject-language",
    strandId: "strand-reading",
    title: "Visual discrimination",
    iconText: "◔",
    cardClass: "bg-teal-100 border-teal-200",
  },
  {
    id: "activity-listening-comprehension",
    subjectId: "subject-language",
    strandId: "strand-listening-speaking",
    title: "Listening for comprehension",
    iconText: "◉",
    cardClass: "bg-cyan-100 border-cyan-200",
  },
  {
    id: "activity-auditory-memory",
    subjectId: "subject-language",
    strandId: "strand-listening-speaking",
    title: "Auditory memory",
    iconText: "♫",
    cardClass: "bg-blue-100 border-blue-200",
  },
  {
    id: "activity-letter-formation",
    subjectId: "subject-language",
    strandId: "strand-writing",
    title: "Letter formation",
    iconText: "✍",
    cardClass: "bg-emerald-100 border-emerald-200",
  },
];

const STATUS_FLOW: LearnerProgressStatus[] = [
  "NEED_MORE_PRACTICE",
  "KEEP_GOING",
  "PRACTICED_ENOUGH",
];

const STATUS_DEFAULT: LearnerProgressStatus = "KEEP_GOING";
const CARD_COLORS = ["bg-rose-100", "bg-sky-100", "bg-amber-100", "bg-lime-100"];
const FIRST_ACTIVITY_ID = ACTIVITIES[0]?.id ?? null;

type MemoryWorkspace = {
  school: TeacherSchoolSettings;
  classes: TeacherClassroom[];
  learners: TeacherLearner[];
  sessionStatuses: Record<string, Record<string, LearnerProgressStatus>>;
  assignments: TeacherMissionAssignment[];
  idCounter: number;
};

type WorkspaceCoreBaseData = Omit<WorkspaceBaseData, "sessionActivityId">;

const memoryStore = new Map<string, MemoryWorkspace>();
const workspaceBaseCache = new Map<
  string,
  { expiresAt: number; staleAt: number; value: WorkspaceCoreBaseData }
>();
const workspaceBaseInflight = new Map<string, Promise<WorkspaceCoreBaseData>>();
const workspaceSnapshotCache = new Map<
  string,
  { expiresAt: number; staleAt: number; value: TeacherWorkspaceSnapshot }
>();
const workspaceSessionStatusesCache = new Map<
  string,
  {
    expiresAt: number;
    staleAt: number;
    value: Pick<TeacherWorkspaceSnapshot, "sessionStatuses">;
  }
>();
const workspaceSessionStatusesInflight = new Map<
  string,
  Promise<Pick<TeacherWorkspaceSnapshot, "sessionStatuses">>
>();
const workspaceAssignmentsCache = new Map<
  string,
  {
    expiresAt: number;
    staleAt: number;
    value: Pick<
      TeacherWorkspaceSnapshot,
      "assignments" | "assignmentAnalytics"
    >;
  }
>();
const workspaceAssignmentsInflight = new Map<
  string,
  Promise<Pick<TeacherWorkspaceSnapshot, "assignments" | "assignmentAnalytics">>
>();

const hasPersistentStore = () => Boolean(process.env.DATABASE_URL && getPrisma());

const nowIso = () => new Date().toISOString();

const workspaceBaseCacheKey = (query: WorkspaceQuery) =>
  [query.ownerKey, query.classId ?? "__default"].join("::");

const workspaceSnapshotCacheKey = (
  query: WorkspaceQuery,
  detailLevel: WorkspaceDetailLevel,
) =>
  [
    query.ownerKey,
    query.classId ?? "",
    query.subjectId ?? "",
    query.strandId ?? "",
    query.activityId ?? "",
    detailLevel,
  ].join("::");

const workspaceSessionStatusesCacheKey = (query: WorkspaceQuery) =>
  [
    query.ownerKey,
    query.classId ?? "",
    query.subjectId ?? "",
    query.strandId ?? "",
    query.activityId ?? "",
  ].join("::");

type WorkspaceDetailContext = Pick<
  WorkspaceBaseData,
  "activeClassId" | "learners" | "sessionActivityId"
>;

const toWorkspaceDetailContext = (
  snapshot: TeacherWorkspaceSnapshot,
): WorkspaceDetailContext => ({
  activeClassId: snapshot.activeClassId,
  learners: snapshot.learners,
  sessionActivityId: snapshot.sessionActivityId,
});

const readWorkspaceDetailContextCache = (
  query: WorkspaceQuery,
): WorkspaceDetailContext | null => {
  const cached =
    readWorkspaceSnapshotCache(query, { detailLevel: "core" }) ??
    readWorkspaceSnapshotCache(query, { detailLevel: "full" }) ??
    readWorkspaceSnapshotCache(query, {
      allowStale: true,
      detailLevel: "core",
    }) ??
    readWorkspaceSnapshotCache(query, {
      allowStale: true,
      detailLevel: "full",
    });

  return cached ? toWorkspaceDetailContext(cached) : null;
};

const readWorkspaceBaseCache = (
  query: WorkspaceQuery,
  options?: { allowStale?: boolean },
) => {
  if (!ENABLE_WORKSPACE_CACHE) return null;
  const entry = workspaceBaseCache.get(workspaceBaseCacheKey(query));
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAt > now) {
    return entry.value;
  }
  if (options?.allowStale && entry.staleAt > now) {
    return entry.value;
  }
  if (entry.staleAt <= now) {
    workspaceBaseCache.delete(workspaceBaseCacheKey(query));
  }
  return null;
};

const writeWorkspaceBaseCache = (
  query: WorkspaceQuery,
  value: WorkspaceCoreBaseData,
) => {
  if (!ENABLE_WORKSPACE_CACHE) return;
  workspaceBaseCache.set(workspaceBaseCacheKey(query), {
    value,
    expiresAt: Date.now() + TEACHER_WORKSPACE_CACHE_TTL_MS,
    staleAt: Date.now() + TEACHER_WORKSPACE_CACHE_STALE_TTL_MS,
  });
};

const readWorkspaceSessionStatusesCache = (
  query: WorkspaceQuery,
  options?: { allowStale?: boolean },
) => {
  if (!ENABLE_WORKSPACE_CACHE) return null;
  const entry = workspaceSessionStatusesCache.get(
    workspaceSessionStatusesCacheKey(query),
  );
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAt > now) {
    return entry.value;
  }
  if (options?.allowStale && entry.staleAt > now) {
    return entry.value;
  }
  if (entry.staleAt <= now) {
    workspaceSessionStatusesCache.delete(workspaceSessionStatusesCacheKey(query));
  }
  return null;
};

const writeWorkspaceSessionStatusesCache = (
  query: WorkspaceQuery,
  value: Pick<TeacherWorkspaceSnapshot, "sessionStatuses">,
) => {
  if (!ENABLE_WORKSPACE_CACHE) return;
  workspaceSessionStatusesCache.set(workspaceSessionStatusesCacheKey(query), {
    value,
    expiresAt: Date.now() + TEACHER_WORKSPACE_CACHE_TTL_MS,
    staleAt: Date.now() + TEACHER_WORKSPACE_CACHE_STALE_TTL_MS,
  });
};

const readWorkspaceAssignmentsCache = (
  ownerKey: string,
  options?: { allowStale?: boolean },
) => {
  if (!ENABLE_WORKSPACE_CACHE) return null;
  const entry = workspaceAssignmentsCache.get(ownerKey);
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAt > now) {
    return entry.value;
  }
  if (options?.allowStale && entry.staleAt > now) {
    return entry.value;
  }
  if (entry.staleAt <= now) {
    workspaceAssignmentsCache.delete(ownerKey);
  }
  return null;
};

const writeWorkspaceAssignmentsCache = (
  ownerKey: string,
  value: Pick<TeacherWorkspaceSnapshot, "assignments" | "assignmentAnalytics">,
) => {
  if (!ENABLE_WORKSPACE_CACHE) return;
  workspaceAssignmentsCache.set(ownerKey, {
    value,
    expiresAt: Date.now() + TEACHER_WORKSPACE_CACHE_TTL_MS,
    staleAt: Date.now() + TEACHER_WORKSPACE_CACHE_STALE_TTL_MS,
  });
};

const readWorkspaceSnapshotCache = (
  query: WorkspaceQuery,
  options?: { allowStale?: boolean; detailLevel?: WorkspaceDetailLevel },
) => {
  if (!ENABLE_WORKSPACE_CACHE) return null;
  const key = workspaceSnapshotCacheKey(query, options?.detailLevel ?? "full");
  const entry = workspaceSnapshotCache.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAt > now) {
    return entry.value;
  }
  if (options?.allowStale && entry.staleAt > now) {
    return entry.value;
  }
  if (entry.staleAt <= now) {
    workspaceSnapshotCache.delete(key);
  }
  return null;
};

const writeWorkspaceSnapshotCache = (
  query: WorkspaceQuery,
  value: TeacherWorkspaceSnapshot,
  options?: { detailLevel?: WorkspaceDetailLevel },
) => {
  if (!ENABLE_WORKSPACE_CACHE) return;
  workspaceSnapshotCache.set(
    workspaceSnapshotCacheKey(query, options?.detailLevel ?? "full"),
    {
      value,
      expiresAt: Date.now() + TEACHER_WORKSPACE_CACHE_TTL_MS,
      staleAt: Date.now() + TEACHER_WORKSPACE_CACHE_STALE_TTL_MS,
    },
  );
};

const invalidateWorkspaceSnapshotCache = (ownerKey: string) => {
  if (!ENABLE_WORKSPACE_CACHE) return;
  for (const key of workspaceBaseCache.keys()) {
    if (key.startsWith(`${ownerKey}::`)) {
      workspaceBaseCache.delete(key);
      workspaceBaseInflight.delete(key);
    }
  }
  for (const key of workspaceSnapshotCache.keys()) {
    if (key.startsWith(`${ownerKey}::`)) {
      workspaceSnapshotCache.delete(key);
    }
  }
  for (const key of workspaceSessionStatusesCache.keys()) {
    if (key.startsWith(`${ownerKey}::`)) {
      workspaceSessionStatusesCache.delete(key);
      workspaceSessionStatusesInflight.delete(key);
    }
  }
  workspaceAssignmentsCache.delete(ownerKey);
  workspaceAssignmentsInflight.delete(ownerKey);
};

const toIso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const ensureSchoolSettings = (ownerKey: string): TeacherSchoolSettings => {
  const suffix = ownerKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "LOCAL";

  return {
    schoolName: "Kwa Njenga",
    country: "Kenya",
    appVersion: "4.1.0",
    deviceId: `lb-${suffix}`,
    connectivityStatus: "OKAY",
    contentStatus: "UP_TO_DATE",
    supportEmail: "support@learnbridge.app",
    schoolQrCode: `LB-${suffix}-2026-PP`,
  };
};

const validateClassInput = (input: AddClassInput) => {
  const name = input.name.trim();
  const grade = input.grade.trim();
  const teacherName = input.teacherName.trim();
  const teacherPhone = input.teacherPhone.trim();

  if (!name || !grade || !teacherName || !teacherPhone) {
    throw new Error("All class fields are required.");
  }
  if (!input.acceptDeviceTerms || !input.acceptDataPolicy) {
    throw new Error("Both consent checkboxes are required.");
  }

  return {
    name,
    grade,
    teacherName,
    teacherPhone,
  };
};

const validateClassUpdate = (input: UpdateClassInput) => {
  const nextName = input.name?.trim();
  const nextGrade = input.grade?.trim();
  const nextTeacherName = input.teacherName?.trim();
  const nextTeacherPhone = input.teacherPhone?.trim();

  if (nextName !== undefined && !nextName) {
    throw new Error("Class name cannot be empty.");
  }
  if (nextGrade !== undefined && !nextGrade) {
    throw new Error("Grade cannot be empty.");
  }
  if (nextTeacherName !== undefined && !nextTeacherName) {
    throw new Error("Teacher name cannot be empty.");
  }
  if (nextTeacherPhone !== undefined && !nextTeacherPhone) {
    throw new Error("Teacher phone cannot be empty.");
  }

  return {
    nextName,
    nextGrade,
    nextTeacherName,
    nextTeacherPhone,
  };
};

const seededLearners = (classId: string): TeacherLearner[] => [
  { id: "learner-joy", classId, name: "Joy Nelima", avatarHue: 210, weeklyMinutes: 32, lastWeekMinutes: 19, createdAt: nowIso() },
  { id: "learner-glory", classId, name: "Glory Ndanu", avatarHue: 344, weeklyMinutes: 28, lastWeekMinutes: 17, createdAt: nowIso() },
  { id: "learner-joshua", classId, name: "Joshua Simon", avatarHue: 45, weeklyMinutes: 24, lastWeekMinutes: 21, createdAt: nowIso() },
  { id: "learner-trevor", classId, name: "Trevor Obama", avatarHue: 123, weeklyMinutes: 17, lastWeekMinutes: 11, createdAt: nowIso() },
  { id: "learner-eunice", classId, name: "Eunice Munini", avatarHue: 271, weeklyMinutes: 11, lastWeekMinutes: 9, createdAt: nowIso() },
  { id: "learner-frank", classId, name: "Frank Mutetei", avatarHue: 18, weeklyMinutes: 8, lastWeekMinutes: 10, createdAt: nowIso() },
  { id: "learner-calvin", classId, name: "Calvince Otieno", avatarHue: 195, weeklyMinutes: 5, lastWeekMinutes: 6, createdAt: nowIso() },
  { id: "learner-adri", classId, name: "Adri Amani", avatarHue: 90, weeklyMinutes: 3, lastWeekMinutes: 7, createdAt: nowIso() },
  { id: "learner-accem", classId, name: "Accem Muthoni", avatarHue: 250, weeklyMinutes: 22, lastWeekMinutes: 20, createdAt: nowIso() },
  { id: "learner-favour", classId, name: "Favour Mtwa", avatarHue: 300, weeklyMinutes: 18, lastWeekMinutes: 13, createdAt: nowIso() },
];

const createMemoryWorkspace = (ownerKey: string): MemoryWorkspace => {
  const createdAt = nowIso();
  const activeClassId = `class-${ownerKey}-pp1`;
  const initialActivityId = FIRST_ACTIVITY_ID;
  const seededAssignments: TeacherMissionAssignment[] = initialActivityId
    ? [
        {
          id: `assignment-${ownerKey}-welcome`,
          classId: activeClassId,
          courseId: "course-logic",
          courseTitle: "AI Pattern Detectives",
          target: "CLASS",
          subjectId: "subject-math",
          strandId: "strand-pre-number",
          activityId: initialActivityId,
          learnerIds: [],
          note: "Starter mission aligned to pre-number sorting.",
          status: "ASSIGNED",
          createdAt,
          updatedAt: createdAt,
          isFallbackData: true,
        },
      ]
    : [];

  return {
    school: ensureSchoolSettings(ownerKey),
    classes: [
      {
        id: activeClassId,
        name: "Tr. Mary and Ashlyn",
        grade: "PP1",
        teacherName: "Mary Wanjiru",
        teacherPhone: "+254700000001",
        cardColor: "bg-rose-100",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: `class-${ownerKey}-pp2a`,
        name: "Dorcas",
        grade: "PP2",
        teacherName: "Dorcas Achieng",
        teacherPhone: "+254700000002",
        cardColor: "bg-sky-100",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: `class-${ownerKey}-pp2b`,
        name: "Stephen & Love",
        grade: "PP2",
        teacherName: "Stephen Omondi",
        teacherPhone: "+254700000003",
        cardColor: "bg-amber-100",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: `class-${ownerKey}-archived`,
        name: "Archived Practice",
        grade: "PP1",
        teacherName: "Temp Teacher",
        teacherPhone: "+254700000099",
        cardColor: "bg-slate-100",
        isArchived: true,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    learners: seededLearners(activeClassId),
    sessionStatuses: {},
    assignments: seededAssignments,
    idCounter: 3000,
  };
};

const getMemoryWorkspace = (ownerKey: string) => {
  const existing = memoryStore.get(ownerKey);
  if (existing) {
    return existing;
  }

  const created = createMemoryWorkspace(ownerKey);
  memoryStore.set(ownerKey, created);
  return created;
};

const isSeededMemoryClassId = (ownerKey: string, classId: string) =>
  classId.startsWith(`class-${ownerKey}-`);

const nextMemoryId = (workspace: MemoryWorkspace, prefix: string) => {
  workspace.idCounter += 1;
  return `${prefix}-${workspace.idCounter}`;
};

const normalizeClassId = (
  classes: Array<{ id: string }>,
  requestedClassId: string | undefined,
) => {
  if (classes.length === 0) {
    return null;
  }

  const requested = requestedClassId
    ? classes.find((item) => item.id === requestedClassId) ?? null
    : null;

  return requested?.id ?? classes[0].id;
};

const normalizeSessionActivity = (
  requestedActivityId: string | undefined,
  subjectId: string | undefined,
  strandId: string | undefined,
) => {
  const scopedByStrand =
    strandId && ACTIVITIES.some((item) => item.strandId === strandId)
      ? ACTIVITIES.find(
          (item) => item.strandId === strandId && item.id === requestedActivityId,
        ) ?? ACTIVITIES.find((item) => item.strandId === strandId) ?? null
      : null;

  if (scopedByStrand) {
    return scopedByStrand.id;
  }

  const scopedBySubject =
    subjectId && ACTIVITIES.some((item) => item.subjectId === subjectId)
      ? ACTIVITIES.find(
          (item) => item.subjectId === subjectId && item.id === requestedActivityId,
        ) ?? ACTIVITIES.find((item) => item.subjectId === subjectId) ?? null
      : null;

  if (scopedBySubject) {
    return scopedBySubject.id;
  }

  const requested = requestedActivityId
    ? ACTIVITIES.find((item) => item.id === requestedActivityId) ?? null
    : null;

  return requested?.id ?? FIRST_ACTIVITY_ID;
};

const buildSessionStatusMap = (
  learners: TeacherLearner[],
  statuses: Record<string, LearnerProgressStatus>,
) => {
  const map: Record<string, LearnerProgressStatus> = {};
  learners.forEach((learner) => {
    map[learner.id] = statuses[learner.id] ?? STATUS_DEFAULT;
  });
  return map;
};

const computeUsage = (learners: TeacherLearner[]) => {
  const thisWeekMinutes = learners.reduce(
    (total, learner) => total + learner.weeklyMinutes,
    0,
  );
  const lastWeekMinutes = learners.reduce(
    (total, learner) => total + learner.lastWeekMinutes,
    0,
  );

  const learnerUsage = [...learners]
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes)
    .map((learner) => ({
      learnerId: learner.id,
      learnerName: learner.name,
      thisWeekMinutes: learner.weeklyMinutes,
      lastWeekMinutes: learner.lastWeekMinutes,
    }));

  return {
    thisWeekMinutes,
    lastWeekMinutes,
    learnerUsage,
  };
};

const emptyAssignmentAnalytics = (): TeacherAssignmentAnalytics => ({
  totalAssignments: 0,
  recentAssignments24h: 0,
  assignedClassCount: 0,
  byTarget: {
    CLASS: 0,
    NEEDS_PRACTICE: 0,
  },
  byStatus: {
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
  },
});

const computeAssignmentAnalytics = (
  assignments: TeacherMissionAssignment[],
): TeacherAssignmentAnalytics => {
  if (assignments.length === 0) {
    return emptyAssignmentAnalytics();
  }

  const summary = emptyAssignmentAnalytics();
  const activeClassIds = new Set<string>();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  assignments.forEach((assignment) => {
    summary.totalAssignments += 1;
    activeClassIds.add(assignment.classId);
    if (Date.parse(assignment.createdAt) >= cutoff) {
      summary.recentAssignments24h += 1;
    }
    if (assignment.target === "NEEDS_PRACTICE") {
      summary.byTarget.NEEDS_PRACTICE += 1;
    } else {
      summary.byTarget.CLASS += 1;
    }

    if (assignment.status === "IN_PROGRESS") {
      summary.byStatus.IN_PROGRESS += 1;
    } else if (assignment.status === "COMPLETED") {
      summary.byStatus.COMPLETED += 1;
    } else {
      summary.byStatus.ASSIGNED += 1;
    }
  });

  summary.assignedClassCount = activeClassIds.size;
  return summary;
};

const assignmentDedupeKey = (input: {
  ownerKey: string;
  classId: string;
  courseId: string;
  target: "CLASS" | "NEEDS_PRACTICE";
  activityId?: string | null;
}) =>
  [
    input.ownerKey,
    input.classId,
    input.courseId,
    input.target,
    input.activityId ?? "none",
  ].join("::");

type TeacherMissionAssignmentDbRow = {
  id: string;
  ownerKey: string;
  classId: string;
  courseId: string;
  courseTitle: string;
  target: string;
  subjectId: string | null;
  strandId: string | null;
  activityId: string | null;
  learnerIds: unknown;
  note: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type TeacherMissionAssignmentDbRowWithClass = TeacherMissionAssignmentDbRow & {
  className: string | null;
};

const mapTeacherMissionAssignmentFromDb = (
  row: TeacherMissionAssignmentDbRow,
): TeacherMissionAssignment => ({
  id: row.id,
  classId: row.classId,
  courseId: row.courseId,
  courseTitle: row.courseTitle,
  target: row.target === "NEEDS_PRACTICE" ? "NEEDS_PRACTICE" : "CLASS",
  subjectId: row.subjectId,
  strandId: row.strandId,
  activityId: row.activityId,
  learnerIds: Array.isArray(row.learnerIds)
    ? row.learnerIds.filter((item): item is string => typeof item === "string")
    : [],
  note: row.note,
  status:
    row.status === "IN_PROGRESS" || row.status === "COMPLETED"
      ? row.status
      : "ASSIGNED",
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
});

const mapSchoolFromDb = (profile: {
  schoolName: string;
  country: string;
  appVersion: string;
  deviceId: string;
  connectivityStatus: string;
  contentStatus: string;
  supportEmail: string;
  schoolQrCode: string;
}): TeacherSchoolSettings => ({
  schoolName: profile.schoolName,
  country: profile.country,
  appVersion: profile.appVersion,
  deviceId: profile.deviceId,
  connectivityStatus:
    profile.connectivityStatus === "LIMITED" ? "LIMITED" : "OKAY",
  contentStatus:
    profile.contentStatus === "SYNCING" ? "SYNCING" : "UP_TO_DATE",
  supportEmail: profile.supportEmail,
  schoolQrCode: profile.schoolQrCode,
});

const mapClassroomFromDb = (classroom: {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  teacherPhone: string;
  cardColor: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TeacherClassroom => ({
  id: classroom.id,
  name: classroom.name,
  grade: classroom.grade,
  teacherName: classroom.teacherName,
  teacherPhone: classroom.teacherPhone,
  cardColor: classroom.cardColor,
  isArchived: classroom.isArchived,
  createdAt: toIso(classroom.createdAt),
  updatedAt: toIso(classroom.updatedAt),
});

const mapLearnerFromDb = (learner: {
  id: string;
  classId: string;
  name: string;
  avatarHue: number;
  weeklyMinutes: number;
  lastWeekMinutes: number;
  createdAt: Date;
}): TeacherLearner => ({
  id: learner.id,
  classId: learner.classId,
  name: learner.name,
  avatarHue: learner.avatarHue,
  weeklyMinutes: learner.weeklyMinutes,
  lastWeekMinutes: learner.lastWeekMinutes,
  createdAt: toIso(learner.createdAt),
});

async function ensureSchoolProfile(ownerKey: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return ensureSchoolSettings(ownerKey);
  }

  const existingProfile = await prisma.teacherSchoolProfile.findUnique({
    where: { ownerKey },
  });
  if (existingProfile) {
    return mapSchoolFromDb(existingProfile);
  }

  const defaults = ensureSchoolSettings(ownerKey);
  try {
    const profile = await prisma.teacherSchoolProfile.create({
      data: {
        ownerKey,
        schoolName: defaults.schoolName,
        country: defaults.country,
        appVersion: defaults.appVersion,
        deviceId: defaults.deviceId,
        connectivityStatus: defaults.connectivityStatus,
        contentStatus: defaults.contentStatus,
        supportEmail: defaults.supportEmail,
        schoolQrCode: defaults.schoolQrCode,
      },
    });

    return mapSchoolFromDb(profile);
  } catch (error) {
    const profile = await prisma.teacherSchoolProfile.findUnique({
      where: { ownerKey },
    });
    if (profile) {
      return mapSchoolFromDb(profile);
    }
    throw error;
  }
}

async function listTeacherMissionAssignmentsFromDatabase(
  ownerKey: string,
): Promise<TeacherMissionAssignment[]> {
  const prisma = getPrisma();
  if (!prisma) {
    return getMemoryWorkspace(ownerKey).assignments;
  }

  const rows = await prisma.$queryRaw<TeacherMissionAssignmentDbRow[]>`
    SELECT
      "id",
      "ownerKey",
      "classId",
      "courseId",
      "courseTitle",
      "target",
      "subjectId",
      "strandId",
      "activityId",
      "learnerIds",
      "note",
      "status",
      "createdAt",
      "updatedAt"
    FROM "TeacherMissionAssignment"
    WHERE "ownerKey" = ${ownerKey}
    ORDER BY "updatedAt" DESC
    LIMIT 200;
  `;

  return rows.map(mapTeacherMissionAssignmentFromDb);
}

async function listTeacherMissionAssignmentsWithClassFromDatabase(input: {
  ownerKey?: string;
}): Promise<TeacherMissionAssignmentDbRowWithClass[]> {
  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  const ownerKeyFilter = input.ownerKey ?? "";
  return prisma.$queryRaw<TeacherMissionAssignmentDbRowWithClass[]>`
    SELECT
      tma."id",
      tma."ownerKey",
      tma."classId",
      tma."courseId",
      tma."courseTitle",
      tma."target",
      tma."subjectId",
      tma."strandId",
      tma."activityId",
      tma."learnerIds",
      tma."note",
      tma."status",
      tma."createdAt",
      tma."updatedAt",
      tc."name" AS "className"
    FROM "TeacherMissionAssignment" tma
    LEFT JOIN "TeacherClassroom" tc ON tc."id" = tma."classId"
    WHERE (${ownerKeyFilter} = '' OR tma."ownerKey" = ${ownerKeyFilter})
    ORDER BY tma."createdAt" DESC
    LIMIT 5000;
  `;
}

async function upsertTeacherMissionAssignmentDatabase(input: {
  ownerKey: string;
  classId: string;
  courseId: string;
  courseTitle: string;
  target: "CLASS" | "NEEDS_PRACTICE";
  subjectId?: string | null;
  strandId?: string | null;
  activityId?: string | null;
  learnerIds?: string[];
  note?: string | null;
},
client?: TeacherStoreDbClient,
): Promise<TeacherMissionAssignment> {
  const prisma = client ?? getPrisma();
  if (!prisma) {
    return upsertTeacherMissionAssignmentMemory(input);
  }

  const learnerIds = Array.from(new Set(input.learnerIds ?? []));
  const dedupeKey = assignmentDedupeKey(input);
  const id = randomUUID();

  const rows = await prisma.$queryRaw<TeacherMissionAssignmentDbRow[]>`
    INSERT INTO "TeacherMissionAssignment" (
      "id",
      "ownerKey",
      "classId",
      "dedupeKey",
      "courseId",
      "courseTitle",
      "target",
      "subjectId",
      "strandId",
      "activityId",
      "learnerIds",
      "note",
      "status",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${id},
      ${input.ownerKey},
      ${input.classId},
      ${dedupeKey},
      ${input.courseId},
      ${input.courseTitle},
      ${input.target},
      ${input.subjectId ?? null},
      ${input.strandId ?? null},
      ${input.activityId ?? null},
      CAST(${JSON.stringify(learnerIds)} AS JSONB),
      ${input.note ?? null},
      ${"ASSIGNED"},
      NOW(),
      NOW()
    )
    ON CONFLICT ("dedupeKey") DO UPDATE
    SET
      "courseTitle" = EXCLUDED."courseTitle",
      "subjectId" = EXCLUDED."subjectId",
      "strandId" = EXCLUDED."strandId",
      "activityId" = EXCLUDED."activityId",
      "learnerIds" = EXCLUDED."learnerIds",
      "note" = EXCLUDED."note",
      "status" = 'ASSIGNED',
      "updatedAt" = NOW()
    RETURNING
      "id",
      "ownerKey",
      "classId",
      "courseId",
      "courseTitle",
      "target",
      "subjectId",
      "strandId",
      "activityId",
      "learnerIds",
      "note",
      "status",
      "createdAt",
      "updatedAt";
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Unable to save mission assignment.");
  }
  return mapTeacherMissionAssignmentFromDb(row);
}

type WorkspaceBaseData = {
  school: TeacherSchoolSettings;
  classes: TeacherClassroom[];
  archivedClasses: TeacherClassroom[];
  activeClassId: string | null;
  learners: TeacherLearner[];
  sessionActivityId: string | null;
};

const buildTeacherWorkspaceSnapshot = (
  base: WorkspaceBaseData,
  input?: {
    isFallbackData?: boolean;
    isPartialData?: boolean;
    sessionStatuses?: Record<string, LearnerProgressStatus>;
    assignments?: TeacherMissionAssignment[];
  },
): TeacherWorkspaceSnapshot => {
  const usage = computeUsage(base.learners);
  const assignments = input?.assignments ?? [];

  return {
    isFallbackData: input?.isFallbackData ?? false,
    isPartialData: input?.isPartialData ?? false,
    school: base.school,
    classes: base.classes,
    archivedClasses: base.archivedClasses,
    activeClassId: base.activeClassId,
    learners: base.learners,
    subjects: SUBJECTS,
    strands: STRANDS,
    activities: ACTIVITIES,
    sessionActivityId: base.sessionActivityId,
    sessionStatuses: input?.sessionStatuses ?? {},
    weeklySummary: {
      thisWeekMinutes: usage.thisWeekMinutes,
      lastWeekMinutes: usage.lastWeekMinutes,
    },
    learnerUsage: usage.learnerUsage,
    assignments,
    assignmentAnalytics: input?.isPartialData
      ? emptyAssignmentAnalytics()
      : computeAssignmentAnalytics(assignments),
  };
};

async function getWorkspaceFromMemory(query: WorkspaceQuery): Promise<TeacherWorkspaceSnapshot> {
  const workspace = getMemoryWorkspace(query.ownerKey);
  const classes = workspace.classes.filter((item) => !item.isArchived);
  const archived = workspace.classes.filter((item) => item.isArchived);

  const activeClassId = normalizeClassId(classes, query.classId);
  const learners = activeClassId
    ? workspace.learners.filter((item) => item.classId === activeClassId)
    : [];

  const sessionActivityId = normalizeSessionActivity(
    query.activityId,
    query.subjectId,
    query.strandId,
  );

  const statusesByActivity = sessionActivityId
    ? workspace.sessionStatuses[sessionActivityId] ?? {}
    : {};

  const sessionStatuses = buildSessionStatusMap(learners, statusesByActivity);

  if (sessionActivityId) {
    workspace.sessionStatuses[sessionActivityId] = {
      ...statusesByActivity,
      ...sessionStatuses,
    };
  }

  return buildTeacherWorkspaceSnapshot(
    {
      school: workspace.school,
      classes,
      archivedClasses: archived,
      activeClassId,
      learners,
      sessionActivityId,
    },
    {
      isFallbackData: true,
      sessionStatuses,
      assignments: workspace.assignments,
    },
  );
}

const buildWorkspaceBaseData = (
  query: WorkspaceQuery,
  base: WorkspaceCoreBaseData,
): WorkspaceBaseData => ({
  ...base,
  sessionActivityId: normalizeSessionActivity(
    query.activityId,
    query.subjectId,
    query.strandId,
  ),
});

async function fetchWorkspaceCoreBaseFromDatabase(
  query: WorkspaceQuery,
): Promise<WorkspaceCoreBaseData> {
  const prisma = getPrisma();
  if (!prisma) {
    const memorySnapshot = await getWorkspaceFromMemory(query);
    return {
      school: memorySnapshot.school,
      classes: memorySnapshot.classes,
      archivedClasses: memorySnapshot.archivedClasses,
      activeClassId: memorySnapshot.activeClassId,
      learners: memorySnapshot.learners,
    };
  }

  const [school, dbClassrooms] = await withTeacherWorkspaceDetailTimeout(
    Promise.all([
      ensureSchoolProfile(query.ownerKey),
      prisma.teacherClassroom.findMany({
        where: { ownerKey: query.ownerKey },
        select: {
          id: true,
          name: true,
          grade: true,
          teacherName: true,
          teacherPhone: true,
          cardColor: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]),
  );

  const dbClasses = dbClassrooms.filter((classroom) => !classroom.isArchived);
  const dbArchived = dbClassrooms.filter((classroom) => classroom.isArchived);
  dbClasses.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  dbArchived.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

  const classes = dbClasses.map(mapClassroomFromDb);
  const archivedClasses = dbArchived.map(mapClassroomFromDb);
  const activeClassId = normalizeClassId(classes, query.classId);

  const dbLearners = activeClassId
    ? await withTeacherWorkspaceDetailTimeout(
        prisma.teacherLearner.findMany({
          where: { classId: activeClassId },
          select: {
            id: true,
            classId: true,
            name: true,
            avatarHue: true,
            weeklyMinutes: true,
            lastWeekMinutes: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "asc" }],
        }),
      )
    : [];

  return {
    school,
    classes,
    archivedClasses,
    activeClassId,
    learners: dbLearners.map(mapLearnerFromDb),
  };
}

async function refreshWorkspaceBaseCache(
  query: WorkspaceQuery,
): Promise<WorkspaceCoreBaseData> {
  const cacheKey = workspaceBaseCacheKey(query);
  const existing = workspaceBaseInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const task = fetchWorkspaceCoreBaseFromDatabase(query).finally(() => {
    workspaceBaseInflight.delete(cacheKey);
  });
  workspaceBaseInflight.set(cacheKey, task);

  const value = await task;
  writeWorkspaceBaseCache(query, value);
  return value;
}

export function prewarmTeacherWorkspaceBase(
  query: Pick<WorkspaceQuery, "ownerKey" | "classId">,
) {
  if (!hasPersistentStore()) {
    return;
  }

  if (readWorkspaceBaseCache(query)) {
    return;
  }

  void refreshWorkspaceBaseCache(query).catch(() => {
    // Warm the classroom base snapshot opportunistically; live requests still
    // fall back to the normal cached or memory-backed path if this misses.
  });
}

async function getWorkspaceBaseFromDatabase(
  query: WorkspaceQuery,
): Promise<WorkspaceBaseData> {
  const cached = readWorkspaceBaseCache(query);
  if (cached) {
    return buildWorkspaceBaseData(query, cached);
  }

  const staleCached = readWorkspaceBaseCache(query, {
    allowStale: true,
  });

  if (!hasPersistentStore()) {
    const memorySnapshot = await getWorkspaceFromMemory(query);
    return {
      school: memorySnapshot.school,
      classes: memorySnapshot.classes,
      archivedClasses: memorySnapshot.archivedClasses,
      activeClassId: memorySnapshot.activeClassId,
      learners: memorySnapshot.learners,
      sessionActivityId: memorySnapshot.sessionActivityId,
    };
  }

  if (staleCached) {
    void refreshWorkspaceBaseCache(query).catch(() => {
      // Reuse the last live classroom snapshot while a background refresh retries.
    });
    return buildWorkspaceBaseData(query, staleCached);
  }

  try {
    const base = await refreshWorkspaceBaseCache(query);
    return buildWorkspaceBaseData(query, base);
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      const memorySnapshot = await getWorkspaceFromMemory(query);
      return {
        school: memorySnapshot.school,
        classes: memorySnapshot.classes,
        archivedClasses: memorySnapshot.archivedClasses,
        activeClassId: memorySnapshot.activeClassId,
        learners: memorySnapshot.learners,
        sessionActivityId: memorySnapshot.sessionActivityId,
      };
    }
    throw error;
  }
}

async function getWorkspaceDetailContextFromDatabase(
  query: WorkspaceQuery,
): Promise<WorkspaceDetailContext> {
  const base = await getWorkspaceBaseFromDatabase(query);
  return {
    activeClassId: base.activeClassId,
    learners: base.learners,
    sessionActivityId: base.sessionActivityId,
  };
}

async function getWorkspaceDetailsFromDatabase(
  query: WorkspaceQuery,
  base: WorkspaceBaseData,
) {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      sessionStatuses: {},
      assignments: getMemoryWorkspace(query.ownerKey).assignments,
    };
  }

  const [dbStatuses, assignments] = await Promise.all([
    base.activeClassId && base.sessionActivityId
      ? prisma.teacherSessionStatus.findMany({
          where: {
            classId: base.activeClassId,
            activityId: base.sessionActivityId,
          },
          select: {
            learnerId: true,
            status: true,
          },
        })
      : Promise.resolve([]),
    listTeacherMissionAssignmentsFromDatabase(query.ownerKey).catch((error) => {
      if (shouldFallbackToMemory(error)) {
        return getMemoryWorkspace(query.ownerKey).assignments;
      }
      throw error;
    }),
  ]);

  const rawStatuses: Record<string, LearnerProgressStatus> = {};
  dbStatuses.forEach((status) => {
    rawStatuses[status.learnerId] = status.status;
  });

  return {
    sessionStatuses: buildSessionStatusMap(base.learners, rawStatuses),
    assignments,
  };
}

async function getWorkspaceFromDatabase(
  query: WorkspaceQuery,
  options?: { detailLevel?: WorkspaceDetailLevel },
): Promise<TeacherWorkspaceSnapshot> {
  const detailLevel = options?.detailLevel ?? "full";
  const base = await getWorkspaceBaseFromDatabase(query);

  if (detailLevel === "core") {
    return buildTeacherWorkspaceSnapshot(base, {
      isPartialData: true,
      sessionStatuses: {},
      assignments: [],
    });
  }

  const details = await getWorkspaceDetailsFromDatabase(query, base);
  return buildTeacherWorkspaceSnapshot(base, {
    sessionStatuses: details.sessionStatuses,
    assignments: details.assignments,
  });
}

const writeWorkspaceDetailCachesFromSnapshot = (
  query: WorkspaceQuery,
  snapshot: TeacherWorkspaceSnapshot,
) => {
  writeWorkspaceBaseCache(query, {
    school: snapshot.school,
    classes: snapshot.classes,
    archivedClasses: snapshot.archivedClasses,
    activeClassId: snapshot.activeClassId,
    learners: snapshot.learners,
  });

  if (snapshot.isPartialData) {
    return;
  }

  writeWorkspaceSessionStatusesCache(query, {
    sessionStatuses: snapshot.sessionStatuses,
  });
  writeWorkspaceAssignmentsCache(query.ownerKey, {
    assignments: snapshot.assignments,
    assignmentAnalytics: snapshot.assignmentAnalytics,
  });
};

async function refreshTeacherWorkspaceSessionStatuses(
  query: WorkspaceQuery,
  options?: { context?: WorkspaceDetailContext | null },
): Promise<Pick<TeacherWorkspaceSnapshot, "sessionStatuses">> {
  const cacheKey = workspaceSessionStatusesCacheKey(query);
  const existing = workspaceSessionStatusesInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    const context =
      options?.context ??
      readWorkspaceDetailContextCache(query) ??
      (await getWorkspaceDetailContextFromDatabase(query));

    if (!context.activeClassId || !context.sessionActivityId) {
      const result = { sessionStatuses: {} };
      writeWorkspaceSessionStatusesCache(query, result);
      return result;
    }

    const prisma = getPrisma();
    if (!prisma) {
      const snapshot = await getWorkspaceFromMemory(query);
      const result = { sessionStatuses: snapshot.sessionStatuses };
      writeWorkspaceSessionStatusesCache(query, result);
      return result;
    }

    const dbStatuses = await withTeacherWorkspaceDetailTimeout(
      prisma.teacherSessionStatus.findMany({
        where: {
          classId: context.activeClassId,
          activityId: context.sessionActivityId,
        },
        select: {
          learnerId: true,
          status: true,
        },
      }),
    );

    const rawStatuses: Record<string, LearnerProgressStatus> = {};
    dbStatuses.forEach((status) => {
      rawStatuses[status.learnerId] = status.status;
    });

    const result = {
      sessionStatuses: buildSessionStatusMap(context.learners, rawStatuses),
    };
    writeWorkspaceSessionStatusesCache(query, result);
    return result;
  })().finally(() => {
    workspaceSessionStatusesInflight.delete(cacheKey);
  });

  workspaceSessionStatusesInflight.set(cacheKey, task);
  return task;
}

async function refreshTeacherWorkspaceAssignments(
  query: WorkspaceQuery,
): Promise<Pick<TeacherWorkspaceSnapshot, "assignments" | "assignmentAnalytics">> {
  const cacheKey = query.ownerKey;
  const existing = workspaceAssignmentsInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    const assignments = await withTeacherWorkspaceDetailTimeout(
      listTeacherMissionAssignmentsFromDatabase(query.ownerKey),
    );
    const result = {
      assignments,
      assignmentAnalytics: computeAssignmentAnalytics(assignments),
    };
    writeWorkspaceAssignmentsCache(query.ownerKey, result);
    return result;
  })().finally(() => {
    workspaceAssignmentsInflight.delete(cacheKey);
  });

  workspaceAssignmentsInflight.set(cacheKey, task);
  return task;
}

const primeTeacherWorkspaceDetailCaches = (
  query: WorkspaceQuery,
  snapshot: TeacherWorkspaceSnapshot,
) => {
  if (!hasPersistentStore() || snapshot.isFallbackData) {
    return;
  }

  const context = toWorkspaceDetailContext(snapshot);
  if (!readWorkspaceSessionStatusesCache(query)) {
    void refreshTeacherWorkspaceSessionStatuses(query, { context }).catch(() => {
      // Keep the core snapshot hot even if secondary session hydration fails.
    });
  }
  if (!readWorkspaceAssignmentsCache(query.ownerKey)) {
    void refreshTeacherWorkspaceAssignments(query).catch(() => {
      // Keep the core snapshot hot even if assignment hydration fails.
    });
  }
};

export async function getTeacherWorkspaceSnapshot(
  query: WorkspaceQuery,
  options?: { detailLevel?: WorkspaceDetailLevel },
): Promise<TeacherWorkspaceSnapshot> {
  const detailLevel = options?.detailLevel ?? "full";
  const cached = readWorkspaceSnapshotCache(query, { detailLevel });
  if (cached) {
    if (detailLevel === "full") {
      writeWorkspaceDetailCachesFromSnapshot(query, cached);
    } else {
      primeTeacherWorkspaceDetailCaches(query, cached);
    }
    return cached;
  }
  const staleCached = readWorkspaceSnapshotCache(query, {
    allowStale: true,
    detailLevel,
  });

  if (!hasPersistentStore()) {
    const snapshot = await getWorkspaceFromMemory(query);
    writeWorkspaceSnapshotCache(query, snapshot, { detailLevel });
    writeWorkspaceDetailCachesFromSnapshot(query, snapshot);
    return snapshot;
  }

  if (process.env.NODE_ENV !== "test" && isScopeDegraded(TEACHER_WORKSPACE_DEGRADED_SCOPE)) {
    if (staleCached) {
      if (detailLevel === "full") {
        writeWorkspaceDetailCachesFromSnapshot(query, staleCached);
      } else {
        primeTeacherWorkspaceDetailCaches(query, staleCached);
      }
      return staleCached;
    }
    const snapshot = await getWorkspaceFromMemory(query);
    writeWorkspaceSnapshotCache(query, snapshot, { detailLevel });
    writeWorkspaceDetailCachesFromSnapshot(query, snapshot);
    return snapshot;
  }
  try {
    const snapshot = await withTeacherWorkspaceTimeout(
      getWorkspaceFromDatabase(query, { detailLevel }),
    );
    clearScopeDegraded(TEACHER_WORKSPACE_DEGRADED_SCOPE);
    writeWorkspaceSnapshotCache(query, snapshot, { detailLevel });
    if (detailLevel === "full") {
      writeWorkspaceDetailCachesFromSnapshot(query, snapshot);
    } else {
      primeTeacherWorkspaceDetailCaches(query, snapshot);
    }
    return snapshot;
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      markScopeDegraded(
        TEACHER_WORKSPACE_DEGRADED_SCOPE,
        error instanceof Error ? error.message : "teacher-workspace-db-failure",
      );
      if (staleCached) {
        if (detailLevel === "full") {
          writeWorkspaceDetailCachesFromSnapshot(query, staleCached);
        } else {
          primeTeacherWorkspaceDetailCaches(query, staleCached);
        }
        return staleCached;
      }
      const snapshot = await getWorkspaceFromMemory(query);
      writeWorkspaceSnapshotCache(query, snapshot, { detailLevel });
      writeWorkspaceDetailCachesFromSnapshot(query, snapshot);
      return snapshot;
    }
    throw error;
  }
}

export async function getTeacherWorkspaceSessionStatuses(
  query: WorkspaceQuery,
): Promise<Pick<TeacherWorkspaceSnapshot, "sessionStatuses">> {
  const cached = readWorkspaceSessionStatusesCache(query);
  if (cached) {
    return cached;
  }

  const staleCached = readWorkspaceSessionStatusesCache(query, {
    allowStale: true,
  });

  if (!hasPersistentStore()) {
    const snapshot = await getWorkspaceFromMemory(query);
    const result = { sessionStatuses: snapshot.sessionStatuses };
    writeWorkspaceSessionStatusesCache(query, result);
    return result;
  }

  if (staleCached) {
    void refreshTeacherWorkspaceSessionStatuses(query).catch(() => {
      // Keep serving the last known detail slice while a live refresh retries.
    });
    return staleCached;
  }

  try {
    return await refreshTeacherWorkspaceSessionStatuses(query);
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      const snapshot = await getWorkspaceFromMemory(query);
      const result = { sessionStatuses: snapshot.sessionStatuses };
      writeWorkspaceSessionStatusesCache(query, result);
      return result;
    }
    throw error;
  }
}

export async function getTeacherWorkspaceAssignments(
  query: WorkspaceQuery,
): Promise<Pick<TeacherWorkspaceSnapshot, "assignments" | "assignmentAnalytics">> {
  const cached = readWorkspaceAssignmentsCache(query.ownerKey);
  if (cached) {
    return cached;
  }

  const staleCached = readWorkspaceAssignmentsCache(query.ownerKey, {
    allowStale: true,
  });

  if (!hasPersistentStore()) {
    const snapshot = await getWorkspaceFromMemory(query);
    const result = {
      assignments: snapshot.assignments,
      assignmentAnalytics: snapshot.assignmentAnalytics,
    };
    writeWorkspaceAssignmentsCache(query.ownerKey, result);
    return result;
  }

  if (staleCached) {
    void refreshTeacherWorkspaceAssignments(query).catch(() => {
      // Keep serving the last known assignment slice while a live refresh retries.
    });
    return staleCached;
  }

  try {
    return await refreshTeacherWorkspaceAssignments(query);
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      const snapshot = await getWorkspaceFromMemory(query);
      const result = {
        assignments: snapshot.assignments,
        assignmentAnalytics: snapshot.assignmentAnalytics,
      };
      writeWorkspaceAssignmentsCache(query.ownerKey, result);
      return result;
    }
    throw error;
  }
}

const shouldFallbackToMemory = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  if (
    maybeError.code === "P1001" ||
    maybeError.code === "P2021" ||
    maybeError.code === "P2022"
  ) {
    return true;
  }

  const message = String(maybeError.message ?? "");
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated due to connection timeout") ||
    message.includes("Connection timeout") ||
    message.includes("timed out") ||
    message.includes("does not exist")
  );
};

const shouldFallbackToMemoryEntityNotFound = (input: {
  error: unknown;
  ownerKey: string;
  classId: string;
  learnerId?: string;
}) => {
  if (!input.error || typeof input.error !== "object") {
    return false;
  }

  const message = String((input.error as { message?: string }).message ?? "");
  const isClassNotFound = message.includes("Class not found.");
  const isLearnerNotFound = message.includes("Learner not found.");
  if (!isClassNotFound && !isLearnerNotFound) {
    return false;
  }

  const memory = getMemoryWorkspace(input.ownerKey);
  const classExists = memory.classes.some((item) => item.id === input.classId);
  if (!classExists) {
    return false;
  }

  if (isLearnerNotFound && input.learnerId) {
    return memory.learners.some(
      (item) => item.id === input.learnerId && item.classId === input.classId,
    );
  }

  return true;
};

const addTeacherClassroomMemory = (
  ownerKey: string,
  validated: ReturnType<typeof validateClassInput>,
) => {
  const workspace = getMemoryWorkspace(ownerKey);
  const classroom: TeacherClassroom = {
    id: nextMemoryId(workspace, "class"),
    name: validated.name,
    grade: validated.grade,
    teacherName: validated.teacherName,
    teacherPhone: validated.teacherPhone,
    cardColor: CARD_COLORS[workspace.classes.length % CARD_COLORS.length],
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  workspace.classes.unshift(classroom);
  return classroom;
};

const updateTeacherClassroomMemory = (
  ownerKey: string,
  classId: string,
  validated: ReturnType<typeof validateClassUpdate>,
) => {
  const workspace = getMemoryWorkspace(ownerKey);
  const classroom = workspace.classes.find((item) => item.id === classId) ?? null;
  if (!classroom) {
    throw new Error("Class not found.");
  }

  classroom.name = validated.nextName ?? classroom.name;
  classroom.grade = validated.nextGrade ?? classroom.grade;
  classroom.teacherName = validated.nextTeacherName ?? classroom.teacherName;
  classroom.teacherPhone = validated.nextTeacherPhone ?? classroom.teacherPhone;
  classroom.updatedAt = nowIso();
  return classroom;
};

const setClassArchivedStateMemory = (
  ownerKey: string,
  classId: string,
  isArchived: boolean,
) => {
  const workspace = getMemoryWorkspace(ownerKey);
  const classroom = workspace.classes.find((item) => item.id === classId) ?? null;
  if (!classroom) {
    throw new Error("Class not found.");
  }
  classroom.isArchived = isArchived;
  classroom.updatedAt = nowIso();
  return classroom;
};

const addTeacherLearnerMemory = (
  ownerKey: string,
  classId: string,
  name: string,
) => {
  const seeded = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const workspace = getMemoryWorkspace(ownerKey);
  const classroom = workspace.classes.find(
    (item) => item.id === classId && !item.isArchived,
  );
  if (!classroom) {
    throw new Error("Class not found.");
  }

  const learner: TeacherLearner = {
    id: nextMemoryId(workspace, "learner"),
    classId,
    name,
    avatarHue: seeded % 360,
    weeklyMinutes: 5 + (seeded % 28),
    lastWeekMinutes: 4 + ((seeded * 3) % 22),
    createdAt: nowIso(),
  };

  workspace.learners.push(learner);
  return learner;
};

const advanceLearnerProgressStatusMemory = (input: {
  ownerKey: string;
  classId: string;
  activityId: string;
  learnerId: string;
}) => {
  const workspace = getMemoryWorkspace(input.ownerKey);
  const classroom = workspace.classes.find(
    (item) => item.id === input.classId && !item.isArchived,
  );
  if (!classroom) {
    throw new Error("Class not found.");
  }

  const learner = workspace.learners.find(
    (item) => item.id === input.learnerId && item.classId === input.classId,
  );
  if (!learner) {
    throw new Error("Learner not found.");
  }

  const scoped = workspace.sessionStatuses[input.activityId] ?? {};
  const current = scoped[input.learnerId] ?? STATUS_DEFAULT;
  const index = STATUS_FLOW.indexOf(current);
  const next = STATUS_FLOW[(index + 1) % STATUS_FLOW.length];

  workspace.sessionStatuses[input.activityId] = {
    ...scoped,
    [input.learnerId]: next,
  };

  return next;
};

const upsertTeacherMissionAssignmentMemory = (input: {
  ownerKey: string;
  classId: string;
  courseId: string;
  courseTitle: string;
  target: "CLASS" | "NEEDS_PRACTICE";
  subjectId?: string | null;
  strandId?: string | null;
  activityId?: string | null;
  learnerIds?: string[];
  note?: string | null;
}) => {
  const workspace = getMemoryWorkspace(input.ownerKey);
  const classroom = workspace.classes.find(
    (item) => item.id === input.classId && !item.isArchived,
  );
  if (!classroom) {
    throw new Error("Class not found.");
  }

  const now = nowIso();
  const normalizedLearnerIds = Array.from(new Set(input.learnerIds ?? []));
  const existing = workspace.assignments.find(
    (assignment) =>
      assignment.classId === input.classId &&
      assignment.courseId === input.courseId &&
      assignment.target === input.target &&
      assignment.activityId === (input.activityId ?? null) &&
      assignment.status !== "COMPLETED",
  );

  if (existing) {
    existing.courseTitle = input.courseTitle;
    existing.subjectId = input.subjectId ?? null;
    existing.strandId = input.strandId ?? null;
    existing.activityId = input.activityId ?? null;
    existing.learnerIds = normalizedLearnerIds;
    existing.note = input.note ?? null;
    existing.updatedAt = now;
    existing.isFallbackData = true;
    return existing;
  }

  const assignment: TeacherMissionAssignment = {
    id: nextMemoryId(workspace, "assignment"),
    classId: input.classId,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    target: input.target,
    subjectId: input.subjectId ?? null,
    strandId: input.strandId ?? null,
    activityId: input.activityId ?? null,
    learnerIds: normalizedLearnerIds,
    note: input.note ?? null,
    status: "ASSIGNED",
    createdAt: now,
    updatedAt: now,
    isFallbackData: true,
  };
  workspace.assignments.unshift(assignment);
  return assignment;
};

export async function addTeacherClassroom(
  ownerKey: string,
  input: AddClassInput,
): Promise<TeacherClassroom> {
  const validated = validateClassInput(input);

  if (!hasPersistentStore()) {
    const classroom = addTeacherClassroomMemory(ownerKey, validated);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return classroom;
  }

  try {
    const prisma = getPrisma()!;
    await ensureSchoolProfile(ownerKey);
    const count = await prisma.teacherClassroom.count({ where: { ownerKey } });

    const classroom = await prisma.teacherClassroom.create({
      data: {
        ownerKey,
        name: validated.name,
        grade: validated.grade,
        teacherName: validated.teacherName,
        teacherPhone: validated.teacherPhone,
        cardColor: CARD_COLORS[count % CARD_COLORS.length],
      },
    });

    const mapped = mapClassroomFromDb(classroom);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return mapped;
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      const classroom = addTeacherClassroomMemory(ownerKey, validated);
      invalidateWorkspaceSnapshotCache(ownerKey);
      return classroom;
    }
    throw error;
  }
}

export async function updateTeacherClassroom(
  ownerKey: string,
  classId: string,
  input: UpdateClassInput,
): Promise<TeacherClassroom> {
  const validated = validateClassUpdate(input);

  if (!hasPersistentStore() || isSeededMemoryClassId(ownerKey, classId)) {
    const classroom = updateTeacherClassroomMemory(ownerKey, classId, validated);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return classroom;
  }

  try {
    const prisma = getPrisma()!;
    const existing = await prisma.teacherClassroom.findFirst({
      where: { id: classId, ownerKey },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Class not found.");
    }

    const classroom = await prisma.teacherClassroom.update({
      where: { id: classId },
      data: {
        name: validated.nextName,
        grade: validated.nextGrade,
        teacherName: validated.nextTeacherName,
        teacherPhone: validated.nextTeacherPhone,
      },
    });

    const mapped = mapClassroomFromDb(classroom);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return mapped;
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({ error, ownerKey, classId })
    ) {
      const classroom = updateTeacherClassroomMemory(ownerKey, classId, validated);
      invalidateWorkspaceSnapshotCache(ownerKey);
      return classroom;
    }
    throw error;
  }
}

async function setClassArchivedState(
  ownerKey: string,
  classId: string,
  isArchived: boolean,
): Promise<TeacherClassroom> {
  if (!hasPersistentStore() || isSeededMemoryClassId(ownerKey, classId)) {
    const classroom = setClassArchivedStateMemory(ownerKey, classId, isArchived);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return classroom;
  }

  try {
    const prisma = getPrisma()!;
    const result = await prisma.teacherClassroom.updateMany({
      where: { id: classId, ownerKey },
      data: { isArchived },
    });

    if (result.count === 0) {
      throw new Error("Class not found.");
    }

    const classroom = await prisma.teacherClassroom.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      throw new Error("Class not found.");
    }

    const mapped = mapClassroomFromDb(classroom);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return mapped;
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({ error, ownerKey, classId })
    ) {
      const classroom = setClassArchivedStateMemory(ownerKey, classId, isArchived);
      invalidateWorkspaceSnapshotCache(ownerKey);
      return classroom;
    }
    throw error;
  }
}

export function archiveTeacherClassroom(ownerKey: string, classId: string) {
  return setClassArchivedState(ownerKey, classId, true);
}

export function restoreTeacherClassroom(ownerKey: string, classId: string) {
  return setClassArchivedState(ownerKey, classId, false);
}

export async function addTeacherLearner(
  ownerKey: string,
  classId: string,
  input: AddLearnerInput,
): Promise<TeacherLearner> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Learner name is required.");
  }

  const seeded = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  if (!hasPersistentStore() || isSeededMemoryClassId(ownerKey, classId)) {
    const learner = addTeacherLearnerMemory(ownerKey, classId, name);
    invalidateWorkspaceSnapshotCache(ownerKey);
    return learner;
  }

  try {
    const mapped = await runTeacherWriteTransaction(async (tx) => {
      const classroom = await tx.teacherClassroom.findFirst({
        where: { id: classId, ownerKey, isArchived: false },
        select: { id: true },
      });

      if (!classroom) {
        throw new Error("Class not found.");
      }

      const learner = await tx.teacherLearner.create({
        data: {
          classId,
          name,
          avatarHue: seeded % 360,
          weeklyMinutes: 5 + (seeded % 28),
          lastWeekMinutes: 4 + ((seeded * 3) % 22),
        },
      });

      return mapLearnerFromDb(learner);
    });
    invalidateWorkspaceSnapshotCache(ownerKey);
    return mapped;
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({ error, ownerKey, classId })
    ) {
      const learner = addTeacherLearnerMemory(ownerKey, classId, name);
      invalidateWorkspaceSnapshotCache(ownerKey);
      return learner;
    }
    throw error;
  }
}

export async function advanceLearnerProgressStatus(input: {
  ownerKey: string;
  classId: string;
  activityId: string;
  learnerId: string;
}): Promise<LearnerProgressStatus> {
  if (!ACTIVITIES.some((item) => item.id === input.activityId)) {
    throw new Error("Activity not found.");
  }

  if (
    !hasPersistentStore() ||
    isSeededMemoryClassId(input.ownerKey, input.classId)
  ) {
    const status = advanceLearnerProgressStatusMemory(input);
    invalidateWorkspaceSnapshotCache(input.ownerKey);
    return status;
  }

  try {
    const next = await runTeacherWriteTransaction(async (tx) => {
      const classroom = await tx.teacherClassroom.findFirst({
        where: { id: input.classId, ownerKey: input.ownerKey, isArchived: false },
        select: { id: true },
      });

      if (!classroom) {
        throw new Error("Class not found.");
      }

      const learner = await tx.teacherLearner.findFirst({
        where: { id: input.learnerId, classId: input.classId },
        select: { id: true },
      });

      if (!learner) {
        throw new Error("Learner not found.");
      }

      const existing = await tx.teacherSessionStatus.findUnique({
        where: {
          classId_learnerId_activityId: {
            classId: input.classId,
            learnerId: input.learnerId,
            activityId: input.activityId,
          },
        },
        select: { status: true },
      });

      const current =
        (existing?.status as LearnerProgressStatus | undefined) ?? STATUS_DEFAULT;
      const index = STATUS_FLOW.indexOf(current);
      const nextStatus = STATUS_FLOW[(index + 1) % STATUS_FLOW.length];

      await tx.teacherSessionStatus.upsert({
        where: {
          classId_learnerId_activityId: {
            classId: input.classId,
            learnerId: input.learnerId,
            activityId: input.activityId,
          },
        },
        update: { status: nextStatus },
        create: {
          classId: input.classId,
          learnerId: input.learnerId,
          activityId: input.activityId,
          status: nextStatus,
        },
      });

      return nextStatus;
    });
    invalidateWorkspaceSnapshotCache(input.ownerKey);
    return next;
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({
        error,
        ownerKey: input.ownerKey,
        classId: input.classId,
        learnerId: input.learnerId,
      })
    ) {
      const status = advanceLearnerProgressStatusMemory(input);
      invalidateWorkspaceSnapshotCache(input.ownerKey);
      return status;
    }
    throw error;
  }
}

export async function getTeacherAssignmentAnalyticsReport(
  filters: TeacherAssignmentAnalyticsFilters,
): Promise<TeacherAssignmentAnalyticsReport> {
  const dateFrom = filters.dateFrom ?? null;
  const dateTo = filters.dateTo ?? null;

  const includeByDate = (createdAt: string) => {
    const timestamp = Date.parse(createdAt);
    if (Number.isNaN(timestamp)) return false;
    if (dateFrom && timestamp < dateFrom.getTime()) return false;
    if (dateTo && timestamp > dateTo.getTime()) return false;
    return true;
  };

  type AssignmentWithClass = {
    assignment: TeacherMissionAssignment;
    className: string;
  };

  let rows: AssignmentWithClass[] = [];

  if (hasPersistentStore()) {
    try {
      const dbRows = await listTeacherMissionAssignmentsWithClassFromDatabase({
        ownerKey: filters.ownerKey,
      });
      rows = dbRows
        .map((row) => ({
          assignment: mapTeacherMissionAssignmentFromDb(row),
          className: row.className ?? "Unknown class",
        }))
        .filter(({ assignment }) => {
          if (filters.classId && assignment.classId !== filters.classId) return false;
          if (filters.target && assignment.target !== filters.target) return false;
          return includeByDate(assignment.createdAt);
        });
    } catch (error) {
      if (!shouldFallbackToMemory(error)) {
        throw error;
      }
      console.warn(
        `[teacher-assignments] analytics report falling back to memory reason=${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
    }
  }

  if (rows.length === 0) {
    const owners = filters.ownerKey
      ? [filters.ownerKey]
      : Array.from(memoryStore.keys());
    rows = owners.flatMap((ownerKey) => {
      const workspace = getMemoryWorkspace(ownerKey);
      const classNameMap = new Map(
        workspace.classes.map((classroom) => [classroom.id, classroom.name]),
      );
      return workspace.assignments
        .filter((assignment) => {
          if (filters.classId && assignment.classId !== filters.classId) return false;
          if (filters.target && assignment.target !== filters.target) return false;
          return includeByDate(assignment.createdAt);
        })
        .map((assignment) => ({
          assignment,
          className: classNameMap.get(assignment.classId) ?? "Unknown class",
        }));
    });
  }

  const assignments = rows.map((row) => row.assignment);
  const summary = computeAssignmentAnalytics(assignments);

  const classAgg = new Map<
    string,
    {
      classId: string;
      className: string;
      totalAssignments: number;
      practiceAssignments: number;
      classAssignments: number;
    }
  >();

  const dayAgg = new Map<
    string,
    { date: string; totalAssignments: number; practiceAssignments: number; classAssignments: number }
  >();

  rows.forEach(({ assignment, className }) => {
    const classCurrent = classAgg.get(assignment.classId) ?? {
      classId: assignment.classId,
      className,
      totalAssignments: 0,
      practiceAssignments: 0,
      classAssignments: 0,
    };
    classCurrent.totalAssignments += 1;
    if (assignment.target === "NEEDS_PRACTICE") {
      classCurrent.practiceAssignments += 1;
    } else {
      classCurrent.classAssignments += 1;
    }
    classAgg.set(assignment.classId, classCurrent);

    const date = assignment.createdAt.slice(0, 10);
    const dayCurrent = dayAgg.get(date) ?? {
      date,
      totalAssignments: 0,
      practiceAssignments: 0,
      classAssignments: 0,
    };
    dayCurrent.totalAssignments += 1;
    if (assignment.target === "NEEDS_PRACTICE") {
      dayCurrent.practiceAssignments += 1;
    } else {
      dayCurrent.classAssignments += 1;
    }
    dayAgg.set(date, dayCurrent);
  });

  return {
    filters: {
      ownerKey: filters.ownerKey ?? null,
      classId: filters.classId ?? null,
      target: filters.target ?? null,
      dateFrom: dateFrom ? dateFrom.toISOString() : null,
      dateTo: dateTo ? dateTo.toISOString() : null,
    },
    summary,
    byClass: Array.from(classAgg.values()).sort(
      (a, b) => b.totalAssignments - a.totalAssignments,
    ),
    byDay: Array.from(dayAgg.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  };
}

export async function assignTeacherMissionToClass(input: {
  ownerKey: string;
  classId: string;
  courseId: string;
  courseTitle: string;
  target: "CLASS" | "NEEDS_PRACTICE";
  subjectId?: string | null;
  strandId?: string | null;
  activityId?: string | null;
  learnerIds?: string[];
  note?: string | null;
}): Promise<TeacherMissionAssignment> {
  if (!hasPersistentStore() || isSeededMemoryClassId(input.ownerKey, input.classId)) {
    const assignment = upsertTeacherMissionAssignmentMemory(input);
    invalidateWorkspaceSnapshotCache(input.ownerKey);
    return assignment;
  }

  try {
    const assignment = await runTeacherWriteTransaction(async (tx) => {
      const classroom = await tx.teacherClassroom.findFirst({
        where: {
          id: input.classId,
          ownerKey: input.ownerKey,
          isArchived: false,
        },
        select: { id: true },
      });
      if (!classroom) {
        throw new Error("Class not found.");
      }

      return upsertTeacherMissionAssignmentDatabase(input, tx);
    });
    invalidateWorkspaceSnapshotCache(input.ownerKey);
    return assignment;
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({
        error,
        ownerKey: input.ownerKey,
        classId: input.classId,
      })
    ) {
      console.warn(
        `[teacher-assignments] db persistence unavailable, using memory fallback owner=${input.ownerKey} classId=${input.classId} reason=${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
      const assignment = upsertTeacherMissionAssignmentMemory(input);
      invalidateWorkspaceSnapshotCache(input.ownerKey);
      return assignment;
    }
    console.error(
      `[teacher-assignments] failed to persist assignment owner=${input.ownerKey} classId=${input.classId}`,
      error,
    );
    throw error;
  }
}
