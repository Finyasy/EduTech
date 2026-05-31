/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getPrismaMock = vi.fn();
const mutableEnv = process.env as Record<string, string | undefined>;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => getPrismaMock(),
}));

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe("teacher workspace snapshot cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
    process.env.DATABASE_URL = "postgresql://local/test";
    mutableEnv.NODE_ENV = "development";
  });

  afterEach(async () => {
    vi.useRealTimers();
    const degradedMode = await import("@/lib/server/degraded-mode");
    degradedMode.clearScopeDegraded("teacher-workspace");
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalNodeEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalNodeEnv;
    }
  });

  it("reuses the last live snapshot when a fresh workspace read times out", async () => {
    const createdAt = new Date("2026-03-11T00:00:00.000Z");

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockResolvedValue({
          schoolName: "Live School",
          country: "Kenya",
          appVersion: "4.1.0",
          deviceId: "lb-live",
          connectivityStatus: "OKAY",
          contentStatus: "UP_TO_DATE",
          supportEmail: "support@example.com",
          schoolQrCode: "LIVE-QR",
        }),
      },
      teacherClassroom: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "class-live",
            name: "Live Class",
            grade: "PP1",
            teacherName: "Mary",
            teacherPhone: "+254700000001",
            cardColor: "bg-sky-100",
            isArchived: false,
            createdAt,
            updatedAt: createdAt,
          },
        ]),
      },
      teacherLearner: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    });

    const { getTeacherWorkspaceSnapshot } = await import("@/lib/server/teacher-store");

    const liveSnapshot = await getTeacherWorkspaceSnapshot({
      ownerKey: "teacher_1",
    });

    expect(liveSnapshot.isFallbackData).toBe(false);
    expect(liveSnapshot.school.schoolName).toBe("Live School");
    expect(liveSnapshot.classes[0]?.id).toBe("class-live");

    await vi.advanceTimersByTimeAsync(6_000);

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      teacherClassroom: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      teacherLearner: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      $queryRaw: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const staleSnapshotPromise = getTeacherWorkspaceSnapshot({
      ownerKey: "teacher_1",
    });

    await vi.advanceTimersByTimeAsync(4_001);
    const staleSnapshot = await staleSnapshotPromise;

    expect(staleSnapshot.isFallbackData).toBe(false);
    expect(staleSnapshot.school.schoolName).toBe("Live School");
    expect(staleSnapshot.classes[0]?.id).toBe("class-live");
  });

  it("returns a partial workspace snapshot without waiting for secondary detail queries to finish", async () => {
    const createdAt = new Date("2026-03-11T00:00:00.000Z");
    const teacherSessionStatusFindMany = vi.fn().mockReturnValue(new Promise(() => {}));
    const assignmentQuery = vi.fn().mockReturnValue(new Promise(() => {}));

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockResolvedValue({
          schoolName: "Live School",
          country: "Kenya",
          appVersion: "4.1.0",
          deviceId: "lb-live",
          connectivityStatus: "OKAY",
          contentStatus: "UP_TO_DATE",
          supportEmail: "support@example.com",
          schoolQrCode: "LIVE-QR",
        }),
      },
      teacherClassroom: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "class-live",
            name: "Live Class",
            grade: "PP1",
            teacherName: "Mary",
            teacherPhone: "+254700000001",
            cardColor: "bg-sky-100",
            isArchived: false,
            createdAt,
            updatedAt: createdAt,
          },
        ]),
      },
      teacherLearner: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "learner-live",
            classId: "class-live",
            name: "Asha",
            avatarHue: 120,
            weeklyMinutes: 15,
            lastWeekMinutes: 12,
            createdAt,
          },
        ]),
      },
      teacherSessionStatus: {
        findMany: teacherSessionStatusFindMany,
      },
      $queryRaw: assignmentQuery,
    });

    const { getTeacherWorkspaceSnapshot } = await import("@/lib/server/teacher-store");

    const snapshot = await getTeacherWorkspaceSnapshot(
      { ownerKey: "teacher_1" },
      { detailLevel: "core" },
    );

    expect(snapshot.isPartialData).toBe(true);
    expect(snapshot.learners[0]?.id).toBe("learner-live");
    expect(snapshot.assignments).toEqual([]);
    expect(snapshot.assignmentAnalytics.totalAssignments).toBe(0);
    expect(teacherSessionStatusFindMany).toHaveBeenCalledTimes(1);
    expect(assignmentQuery).toHaveBeenCalledTimes(1);
  });

  it("reuses the cached core workspace context when hydrating session statuses", async () => {
    const createdAt = new Date("2026-03-11T00:00:00.000Z");
    const teacherClassroomFindMany = vi.fn().mockResolvedValue([
      {
        id: "class-live",
        name: "Live Class",
        grade: "PP1",
        teacherName: "Mary",
        teacherPhone: "+254700000001",
        cardColor: "bg-sky-100",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
    ]);
    const teacherLearnerFindMany = vi.fn().mockResolvedValue([
      {
        id: "learner-live",
        classId: "class-live",
        name: "Asha",
        avatarHue: 120,
        weeklyMinutes: 15,
        lastWeekMinutes: 12,
        createdAt,
      },
    ]);
    const teacherSessionStatusFindMany = vi.fn().mockResolvedValue([
      {
        learnerId: "learner-live",
        status: "PRACTICED_ENOUGH" as const,
      },
    ]);
    const assignmentQuery = vi.fn().mockResolvedValue([]);

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockResolvedValue({
          schoolName: "Live School",
          country: "Kenya",
          appVersion: "4.1.0",
          deviceId: "lb-live",
          connectivityStatus: "OKAY",
          contentStatus: "UP_TO_DATE",
          supportEmail: "support@example.com",
          schoolQrCode: "LIVE-QR",
        }),
      },
      teacherClassroom: {
        findMany: teacherClassroomFindMany,
      },
      teacherLearner: {
        findMany: teacherLearnerFindMany,
      },
      teacherSessionStatus: {
        findMany: teacherSessionStatusFindMany,
      },
      $queryRaw: assignmentQuery,
    });

    const {
      getTeacherWorkspaceSnapshot,
      getTeacherWorkspaceSessionStatuses,
    } = await import("@/lib/server/teacher-store");

    const snapshot = await getTeacherWorkspaceSnapshot(
      { ownerKey: "teacher_1" },
      { detailLevel: "core" },
    );
    const statuses = await getTeacherWorkspaceSessionStatuses({
      ownerKey: "teacher_1",
    });

    expect(snapshot.isPartialData).toBe(true);
    expect(statuses.sessionStatuses).toEqual({
      "learner-live": "PRACTICED_ENOUGH",
    });
    expect(teacherClassroomFindMany).toHaveBeenCalledTimes(1);
    expect(teacherLearnerFindMany).toHaveBeenCalledTimes(1);
    expect(teacherSessionStatusFindMany).toHaveBeenCalledTimes(1);
  });

  it("reuses cached base data across core workspace query changes for the same class", async () => {
    const createdAt = new Date("2026-03-11T00:00:00.000Z");
    const teacherSchoolProfileFindUnique = vi.fn().mockResolvedValue({
      schoolName: "Live School",
      country: "Kenya",
      appVersion: "4.1.0",
      deviceId: "lb-live",
      connectivityStatus: "OKAY",
      contentStatus: "UP_TO_DATE",
      supportEmail: "support@example.com",
      schoolQrCode: "LIVE-QR",
    });
    const teacherClassroomFindMany = vi.fn().mockResolvedValue([
      {
        id: "class-live",
        name: "Live Class",
        grade: "PP1",
        teacherName: "Mary",
        teacherPhone: "+254700000001",
        cardColor: "bg-sky-100",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
    ]);
    const teacherLearnerFindMany = vi.fn().mockResolvedValue([
      {
        id: "learner-live",
        classId: "class-live",
        name: "Asha",
        avatarHue: 120,
        weeklyMinutes: 15,
        lastWeekMinutes: 12,
        createdAt,
      },
    ]);

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: teacherSchoolProfileFindUnique,
      },
      teacherClassroom: {
        findMany: teacherClassroomFindMany,
      },
      teacherLearner: {
        findMany: teacherLearnerFindMany,
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    });

    const { getTeacherWorkspaceSnapshot } = await import("@/lib/server/teacher-store");

    await getTeacherWorkspaceSnapshot(
      {
        ownerKey: "teacher_1",
        classId: "class-live",
        subjectId: "subject-math",
        strandId: "strand-pre-number",
        activityId: "activity-sorting-grouping",
      },
      { detailLevel: "core" },
    );

    await getTeacherWorkspaceSnapshot(
      {
        ownerKey: "teacher_1",
        classId: "class-live",
        subjectId: "subject-language",
        strandId: "strand-reading",
        activityId: "activity-print-awareness",
      },
      { detailLevel: "core" },
    );

    expect(teacherSchoolProfileFindUnique).toHaveBeenCalledTimes(1);
    expect(teacherClassroomFindMany).toHaveBeenCalledTimes(1);
    expect(teacherLearnerFindMany).toHaveBeenCalledTimes(1);
  });

  it("dedupes assignment hydration against the core snapshot warmup", async () => {
    const createdAt = new Date("2026-03-11T00:00:00.000Z");
    let resolveAssignments!: (value: unknown[]) => void;
    const assignmentQuery = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAssignments = resolve;
        }),
    );

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockResolvedValue({
          schoolName: "Live School",
          country: "Kenya",
          appVersion: "4.1.0",
          deviceId: "lb-live",
          connectivityStatus: "OKAY",
          contentStatus: "UP_TO_DATE",
          supportEmail: "support@example.com",
          schoolQrCode: "LIVE-QR",
        }),
      },
      teacherClassroom: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "class-live",
            name: "Live Class",
            grade: "PP1",
            teacherName: "Mary",
            teacherPhone: "+254700000001",
            cardColor: "bg-sky-100",
            isArchived: false,
            createdAt,
            updatedAt: createdAt,
          },
        ]),
      },
      teacherLearner: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRaw: assignmentQuery,
    });

    const {
      getTeacherWorkspaceSnapshot,
      getTeacherWorkspaceAssignments,
    } = await import("@/lib/server/teacher-store");

    await getTeacherWorkspaceSnapshot(
      { ownerKey: "teacher_1" },
      { detailLevel: "core" },
    );

    const assignmentsPromise = getTeacherWorkspaceAssignments({
      ownerKey: "teacher_1",
    });

    expect(assignmentQuery).toHaveBeenCalledTimes(1);

    resolveAssignments([
      {
        id: "assignment-1",
        ownerKey: "teacher_1",
        classId: "class-live",
        courseId: "course-logic",
        courseTitle: "AI Pattern Detectives",
        target: "CLASS",
        subjectId: "subject-math",
        strandId: "strand-pre-number",
        activityId: "activity-sorting-grouping",
        learnerIds: [],
        note: null,
        status: "ASSIGNED",
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const result = await assignmentsPromise;

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.id).toBe("assignment-1");
    expect(result.assignmentAnalytics.totalAssignments).toBe(1);
    expect(assignmentQuery).toHaveBeenCalledTimes(1);
  });

  it("falls back to memory when session status hydration times out", async () => {
    delete process.env.DATABASE_URL;
    const { addTeacherClassroom, addTeacherLearner, getTeacherWorkspaceSessionStatuses } =
      await import("@/lib/server/teacher-store");
    const ownerKey = "teacher_timeout_session";

    const classroom = await addTeacherClassroom(ownerKey, {
      name: "Latency Test",
      grade: "PP1",
      teacherName: "Mary",
      teacherPhone: "+254700000001",
      acceptDeviceTerms: true,
      acceptDataPolicy: true,
    });

    const learner = await addTeacherLearner(ownerKey, classroom.id, {
      name: "Asha",
    });

    process.env.DATABASE_URL = "postgresql://local/test";
    const fallbackWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockResolvedValue({
          schoolName: "Live School",
          country: "Kenya",
          appVersion: "4.1.0",
          deviceId: "lb-live",
          connectivityStatus: "OKAY",
          contentStatus: "UP_TO_DATE",
          supportEmail: "support@example.com",
          schoolQrCode: "LIVE-QR",
        }),
      },
      teacherClassroom: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: classroom.id,
            name: classroom.name,
            grade: classroom.grade,
            teacherName: classroom.teacherName,
            teacherPhone: classroom.teacherPhone,
            cardColor: classroom.cardColor,
            isArchived: false,
            createdAt: new Date(classroom.createdAt),
            updatedAt: new Date(classroom.updatedAt),
          },
        ]),
      },
      teacherLearner: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "learner-1",
            classId: classroom.id,
            userId: null,
            name: "Asha",
            avatarHue: 120,
            weeklyMinutes: 15,
            lastWeekMinutes: 12,
            createdAt: new Date("2026-03-11T00:00:00.000Z"),
          },
        ]),
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    });

    const resultPromise = getTeacherWorkspaceSessionStatuses({
      ownerKey,
      classId: classroom.id,
      activityId: "activity-sorting-grouping",
    });

    await vi.advanceTimersByTimeAsync(2_501);
    const result = await resultPromise;

    expect(result).toEqual({
      sessionStatuses: { [learner.id]: "KEEP_GOING" },
    });
    expect(fallbackWarnSpy).toHaveBeenCalledWith(
      "[teacher-store-fallback]",
      expect.objectContaining({
        event: "workspace-session-statuses",
        ownerKey,
        classId: classroom.id,
      }),
    );
    fallbackWarnSpy.mockRestore();
  });

  it("falls back to memory when assignment hydration times out", async () => {
    delete process.env.DATABASE_URL;
    const { addTeacherClassroom, assignTeacherMissionToClass, getTeacherWorkspaceAssignments } =
      await import("@/lib/server/teacher-store");
    const ownerKey = "teacher_timeout_assignments";

    const classroom = await addTeacherClassroom(ownerKey, {
      name: "Latency Test",
      grade: "PP1",
      teacherName: "Mary",
      teacherPhone: "+254700000001",
      acceptDeviceTerms: true,
      acceptDataPolicy: true,
    });

    const seededAssignment = await assignTeacherMissionToClass({
      ownerKey,
      classId: classroom.id,
      courseId: "course-logic",
      courseTitle: "AI Pattern Detectives",
      target: "CLASS",
      subjectId: "subject-math",
      strandId: "strand-pre-number",
      activityId: "activity-sorting-grouping",
      note: "Keep the class moving.",
    });

    process.env.DATABASE_URL = "postgresql://local/test";
    const fallbackWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    getPrismaMock.mockReturnValue({
      $queryRaw: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const resultPromise = getTeacherWorkspaceAssignments({
      ownerKey,
    });

    await vi.advanceTimersByTimeAsync(2_501);
    const result = await resultPromise;

    expect(result.assignments.some((assignment) => assignment.id === seededAssignment.id)).toBe(true);
    expect(result.assignmentAnalytics.totalAssignments).toBeGreaterThanOrEqual(1);
    expect(fallbackWarnSpy).toHaveBeenCalledWith(
      "[teacher-store-fallback]",
      expect.objectContaining({
        event: "workspace-assignments",
        ownerKey,
      }),
    );
    fallbackWarnSpy.mockRestore();
  });

  it("falls back to memory quickly when learner creation stalls in Prisma", async () => {
    delete process.env.DATABASE_URL;
    const { addTeacherClassroom, addTeacherLearner } = await import(
      "@/lib/server/teacher-store"
    );

    const classroom = await addTeacherClassroom("teacher_1", {
      name: "Latency Test",
      grade: "PP1",
      teacherName: "Mary",
      teacherPhone: "+254700000001",
      acceptDeviceTerms: true,
      acceptDataPolicy: true,
    });

    process.env.DATABASE_URL = "postgresql://local/test";
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const learnerPromise = addTeacherLearner("teacher_1", classroom.id, {
      name: "Asha",
    });

    await vi.advanceTimersByTimeAsync(1_801);
    const learner = await learnerPromise;

    expect(learner.classId).toBe(classroom.id);
    expect(learner.name).toBe("Asha");
    expect(learner.id).toMatch(/^learner-/);
  });

  it("rejects linking a teacher account as a learner", async () => {
    process.env.DATABASE_URL = "postgresql://local/test";
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
          teacherClassroom: {
            findFirst: vi.fn().mockResolvedValue({ id: "class-live" }),
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: "teacher-user",
              role: "TEACHER",
            }),
          },
          teacherLearner: {
            create: vi.fn(),
          },
        }),
      ),
    });

    const { addTeacherLearner } = await import("@/lib/server/teacher-store");

    await expect(
      addTeacherLearner("teacher_1", "class-live", {
        name: "Asha",
        userEmail: "teacher@example.com",
      }),
    ).rejects.toThrow("Only learner accounts can be linked to a classroom.");
  });

  it("falls back to memory quickly when learner session updates stall in Prisma", async () => {
    delete process.env.DATABASE_URL;
    const {
      addTeacherClassroom,
      addTeacherLearner,
      advanceLearnerProgressStatus,
    } = await import("@/lib/server/teacher-store");

    const classroom = await addTeacherClassroom("teacher_1", {
      name: "Latency Test",
      grade: "PP1",
      teacherName: "Mary",
      teacherPhone: "+254700000001",
      acceptDeviceTerms: true,
      acceptDataPolicy: true,
    });

    const learner = await addTeacherLearner("teacher_1", classroom.id, {
      name: "Asha",
    });

    process.env.DATABASE_URL = "postgresql://local/test";
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const statusPromise = advanceLearnerProgressStatus({
      ownerKey: "teacher_1",
      classId: classroom.id,
      activityId: "activity-sorting-grouping",
      learnerId: learner.id,
    });

    await vi.advanceTimersByTimeAsync(1_801);
    const status = await statusPromise;

    expect(status).toBe("PRACTICED_ENOUGH");
  });

  it("falls back to memory quickly when mission assignment writes stall in Prisma", async () => {
    delete process.env.DATABASE_URL;
    const { addTeacherClassroom, assignTeacherMissionToClass } = await import(
      "@/lib/server/teacher-store"
    );

    const classroom = await addTeacherClassroom("teacher_1", {
      name: "Latency Test",
      grade: "PP1",
      teacherName: "Mary",
      teacherPhone: "+254700000001",
      acceptDeviceTerms: true,
      acceptDataPolicy: true,
    });

    process.env.DATABASE_URL = "postgresql://local/test";
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const assignmentPromise = assignTeacherMissionToClass({
      ownerKey: "teacher_1",
      classId: classroom.id,
      courseId: "course-logic",
      courseTitle: "AI Pattern Detectives",
      target: "CLASS",
      subjectId: "subject-math",
      strandId: "strand-pre-number",
      activityId: "activity-sorting-grouping",
      note: "Keep the class moving.",
    });

    await vi.advanceTimersByTimeAsync(1_801);
    const assignment = await assignmentPromise;

    expect(assignment.classId).toBe(classroom.id);
    expect(assignment.courseId).toBe("course-logic");
    expect(assignment.isFallbackData).toBe(true);
  });
});
