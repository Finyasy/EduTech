/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const parseJsonBodyMock = vi.fn();
const upsertTeacherLearnerCurriculumEvidenceMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/request", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/request")>();
  return {
    ...actual,
    parseJsonBody: (...args: unknown[]) => parseJsonBodyMock(...args),
  };
});

vi.mock("@/lib/server/teacher-store", () => ({
  upsertTeacherLearnerCurriculumEvidence: (...args: unknown[]) =>
    upsertTeacherLearnerCurriculumEvidenceMock(...args),
}));

describe("PATCH /api/teach/class/[classId]/learner/[learnerId]/curriculum-evidence/[competencyId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the teacher is not authorized", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue(null);

    const { PATCH } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/curriculum-evidence/[competencyId]/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/curriculum-evidence/pp1-counting-5-9", {
        method: "PATCH",
      }),
      {
        params: Promise.resolve({
          classId: "class-1",
          learnerId: "learner-1",
          competencyId: "pp1-counting-5-9",
        }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 on invalid payload", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { countedEachObjectOnce: "yes" },
    });

    const { PATCH } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/curriculum-evidence/[competencyId]/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/curriculum-evidence/pp1-counting-5-9", {
        method: "PATCH",
      }),
      {
        params: Promise.resolve({
          classId: "class-1",
          learnerId: "learner-1",
          competencyId: "pp1-counting-5-9",
        }),
      },
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Invalid payload");
  });

  it("saves teacher judgement for the PP1 counting competency", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        note: "Counted each object once after one reminder.",
        rubricLevelOverride: "MEETS_EXPECTATION",
        supportLevelOverride: "NORMAL_INSTRUCTION",
        countedEachObjectOnce: true,
        skippedDoubleCounted: false,
        matchedNumeralCorrectly: true,
        neededPrompts: true,
      },
    });
    upsertTeacherLearnerCurriculumEvidenceMock.mockResolvedValue({
      note: "Counted each object once after one reminder.",
      rubricLevelOverride: "MEETS_EXPECTATION",
      supportLevelOverride: "NORMAL_INSTRUCTION",
      countedEachObjectOnce: true,
      skippedDoubleCounted: false,
      matchedNumeralCorrectly: true,
      neededPrompts: true,
      updatedAt: "2026-05-31T10:00:00.000Z",
    });

    const { PATCH } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/curriculum-evidence/[competencyId]/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/curriculum-evidence/pp1-counting-5-9", {
        method: "PATCH",
      }),
      {
        params: Promise.resolve({
          classId: "class-1",
          learnerId: "learner-1",
          competencyId: "pp1-counting-5-9",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(upsertTeacherLearnerCurriculumEvidenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerKey: "teacher_1",
        classId: "class-1",
        learnerId: "learner-1",
        competencyId: "pp1-counting-5-9",
        rubricLevelOverride: "MEETS_EXPECTATION",
      }),
    );
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        competencyId: "pp1-counting-5-9",
        teacherJudgement: expect.objectContaining({
          countedEachObjectOnce: true,
          matchedNumeralCorrectly: true,
        }),
      }),
    );
  });

  it("returns 503 when evidence persistence times out", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {},
    });
    upsertTeacherLearnerCurriculumEvidenceMock.mockRejectedValue(
      new Error("Teacher write query timed out"),
    );

    const { PATCH } = await import(
      "@/app/api/teach/class/[classId]/learner/[learnerId]/curriculum-evidence/[competencyId]/route"
    );
    const response = await PATCH(
      new Request("http://localhost/api/teach/class/class-1/learner/learner-1/curriculum-evidence/pp1-counting-5-9", {
        method: "PATCH",
      }),
      {
        params: Promise.resolve({
          classId: "class-1",
          learnerId: "learner-1",
          competencyId: "pp1-counting-5-9",
        }),
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
