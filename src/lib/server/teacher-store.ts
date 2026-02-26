import "server-only";
import { getPrisma } from "@/lib/server/prisma";
import type {
  LearnerProgressStatus,
  TeacherActivity,
  TeacherClassroom,
  TeacherLearner,
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

const TEACHER_WORKSPACE_QUERY_TIMEOUT_MS = 800;

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
  idCounter: number;
};

const memoryStore = new Map<string, MemoryWorkspace>();

const hasPersistentStore = () => Boolean(process.env.DATABASE_URL && getPrisma());

const nowIso = () => new Date().toISOString();

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
  classes: TeacherClassroom[],
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

  const defaults = ensureSchoolSettings(ownerKey);
  const profile = await prisma.teacherSchoolProfile.upsert({
    where: { ownerKey },
    update: {},
    create: {
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
}

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
  const usage = computeUsage(learners);

  if (sessionActivityId) {
    workspace.sessionStatuses[sessionActivityId] = {
      ...statusesByActivity,
      ...sessionStatuses,
    };
  }

  return {
    isFallbackData: true,
    school: workspace.school,
    classes,
    archivedClasses: archived,
    activeClassId,
    learners,
    subjects: SUBJECTS,
    strands: STRANDS,
    activities: ACTIVITIES,
    sessionActivityId,
    sessionStatuses,
    weeklySummary: {
      thisWeekMinutes: usage.thisWeekMinutes,
      lastWeekMinutes: usage.lastWeekMinutes,
    },
    learnerUsage: usage.learnerUsage,
  };
}

async function getWorkspaceFromDatabase(
  query: WorkspaceQuery,
): Promise<TeacherWorkspaceSnapshot> {
  const prisma = getPrisma();
  if (!prisma) {
    return getWorkspaceFromMemory(query);
  }

  const [school, dbClasses, dbArchived] = await Promise.all([
    ensureSchoolProfile(query.ownerKey),
    prisma.teacherClassroom.findMany({
      where: { ownerKey: query.ownerKey, isArchived: false },
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.teacherClassroom.findMany({
      where: { ownerKey: query.ownerKey, isArchived: true },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  const classes = dbClasses.map(mapClassroomFromDb);
  const archivedClasses = dbArchived.map(mapClassroomFromDb);
  const activeClassId = normalizeClassId(classes, query.classId);

  const dbLearners = activeClassId
    ? await prisma.teacherLearner.findMany({
        where: { classId: activeClassId },
        orderBy: [{ createdAt: "asc" }],
      })
    : [];

  const learners = dbLearners.map(mapLearnerFromDb);

  const sessionActivityId = normalizeSessionActivity(
    query.activityId,
    query.subjectId,
    query.strandId,
  );

  const dbStatuses =
    activeClassId && sessionActivityId
      ? await prisma.teacherSessionStatus.findMany({
          where: {
            classId: activeClassId,
            activityId: sessionActivityId,
          },
        })
      : [];

  const rawStatuses: Record<string, LearnerProgressStatus> = {};
  dbStatuses.forEach((status) => {
    rawStatuses[status.learnerId] = status.status;
  });

  const sessionStatuses = buildSessionStatusMap(learners, rawStatuses);
  const usage = computeUsage(learners);

  return {
    isFallbackData: false,
    school,
    classes,
    archivedClasses,
    activeClassId,
    learners,
    subjects: SUBJECTS,
    strands: STRANDS,
    activities: ACTIVITIES,
    sessionActivityId,
    sessionStatuses,
    weeklySummary: {
      thisWeekMinutes: usage.thisWeekMinutes,
      lastWeekMinutes: usage.lastWeekMinutes,
    },
    learnerUsage: usage.learnerUsage,
  };
}

export async function getTeacherWorkspaceSnapshot(
  query: WorkspaceQuery,
): Promise<TeacherWorkspaceSnapshot> {
  if (!hasPersistentStore()) {
    return getWorkspaceFromMemory(query);
  }
  try {
    return await withTeacherWorkspaceTimeout(getWorkspaceFromDatabase(query));
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      return getWorkspaceFromMemory(query);
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

export async function addTeacherClassroom(
  ownerKey: string,
  input: AddClassInput,
): Promise<TeacherClassroom> {
  const validated = validateClassInput(input);

  if (!hasPersistentStore()) {
    return addTeacherClassroomMemory(ownerKey, validated);
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

    return mapClassroomFromDb(classroom);
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      return addTeacherClassroomMemory(ownerKey, validated);
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
    return updateTeacherClassroomMemory(ownerKey, classId, validated);
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

    return mapClassroomFromDb(classroom);
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({ error, ownerKey, classId })
    ) {
      return updateTeacherClassroomMemory(ownerKey, classId, validated);
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
    return setClassArchivedStateMemory(ownerKey, classId, isArchived);
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

    return mapClassroomFromDb(classroom);
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({ error, ownerKey, classId })
    ) {
      return setClassArchivedStateMemory(ownerKey, classId, isArchived);
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
    return addTeacherLearnerMemory(ownerKey, classId, name);
  }

  try {
    const prisma = getPrisma()!;
    const classroom = await prisma.teacherClassroom.findFirst({
      where: { id: classId, ownerKey, isArchived: false },
      select: { id: true },
    });

    if (!classroom) {
      throw new Error("Class not found.");
    }

    const learner = await prisma.teacherLearner.create({
      data: {
        classId,
        name,
        avatarHue: seeded % 360,
        weeklyMinutes: 5 + (seeded % 28),
        lastWeekMinutes: 4 + ((seeded * 3) % 22),
      },
    });

    return mapLearnerFromDb(learner);
  } catch (error) {
    if (
      shouldFallbackToMemory(error) ||
      shouldFallbackToMemoryEntityNotFound({ error, ownerKey, classId })
    ) {
      return addTeacherLearnerMemory(ownerKey, classId, name);
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
    return advanceLearnerProgressStatusMemory(input);
  }

  try {
    const prisma = getPrisma()!;
    const classroom = await prisma.teacherClassroom.findFirst({
      where: { id: input.classId, ownerKey: input.ownerKey, isArchived: false },
      select: { id: true },
    });

    if (!classroom) {
      throw new Error("Class not found.");
    }

    const learner = await prisma.teacherLearner.findFirst({
      where: { id: input.learnerId, classId: input.classId },
      select: { id: true },
    });

    if (!learner) {
      throw new Error("Learner not found.");
    }

    const existing = await prisma.teacherSessionStatus.findUnique({
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
    const next = STATUS_FLOW[(index + 1) % STATUS_FLOW.length];

    await prisma.teacherSessionStatus.upsert({
      where: {
        classId_learnerId_activityId: {
          classId: input.classId,
          learnerId: input.learnerId,
          activityId: input.activityId,
        },
      },
      update: { status: next },
      create: {
        classId: input.classId,
        learnerId: input.learnerId,
        activityId: input.activityId,
        status: next,
      },
    });

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
      return advanceLearnerProgressStatusMemory(input);
    }
    throw error;
  }
}
