/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const getTeacherLearnerDashboardSummaryMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/data", () => ({
  getTeacherLearnerDashboardSummary: (...args: unknown[]) =>
    getTeacherLearnerDashboardSummaryMock(...args),
}));

describe("GET /api/teach/class/[classId]/learner/[learnerId]/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the teacher is not authorized", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue(null);

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/dashboard/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/dashboard"),
      {
        params: Promise.resolve({ classId: "class-1", learnerId: "learner-1" }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when the learner is not attached to the requesting teacher", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    getTeacherLearnerDashboardSummaryMock.mockResolvedValue(null);

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/dashboard/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/dashboard"),
      {
        params: Promise.resolve({ classId: "class-1", learnerId: "learner-1" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Learner not found" });
  });

  it("returns the learner summary for an attached learner", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    getTeacherLearnerDashboardSummaryMock.mockResolvedValue({
      learner: {
        id: "learner-1",
        classId: "class-1",
        userId: "user-1",
        name: "Asha",
        linkedAccount: true,
      },
      dashboard: {
        continueWatching: null,
        completedTotal: 4,
        completedThisWeek: 2,
        streakDays: 2,
        mastery: { ai: 60, coding: 50, math: 55 },
      },
      quiz: {
        attemptCount: 3,
        averageScore: 4.5,
        latestScore: 5,
        latestSubmittedAt: "2026-05-22T10:00:00.000Z",
      },
      games: {
        attemptCount: 7,
        bestRecordCount: 2,
        bestScore: 18,
        latestSubmittedAt: "2026-05-22T11:00:00.000Z",
      },
      artifacts: {
        totalCount: 2,
        reviewedCount: 1,
        recent: [],
      },
    });

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/dashboard/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/dashboard"),
      {
        params: Promise.resolve({ classId: "class-1", learnerId: "learner-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(getTeacherLearnerDashboardSummaryMock).toHaveBeenCalledWith({
      ownerKey: "teacher_1",
      classId: "class-1",
      learnerId: "learner-1",
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        learner: expect.objectContaining({
          id: "learner-1",
          linkedAccount: true,
        }),
        quiz: expect.objectContaining({ attemptCount: 3 }),
      }),
    );
  });

  it("returns 503 when learner summary hydration times out", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    getTeacherLearnerDashboardSummaryMock.mockRejectedValue(
      new Error("teacher learner dashboard timed out"),
    );

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/dashboard/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/dashboard"),
      {
        params: Promise.resolve({ classId: "class-1", learnerId: "learner-1" }),
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
