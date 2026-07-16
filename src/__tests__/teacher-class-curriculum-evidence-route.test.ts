/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const listTeacherClassCurriculumEvidenceMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/data", () => ({
  listTeacherClassCurriculumEvidence: (...args: unknown[]) =>
    listTeacherClassCurriculumEvidenceMock(...args),
}));

describe("GET /api/teach/class/[classId]/curriculum-evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the teacher is not authorized", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue(null);

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/curriculum-evidence/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/curriculum-evidence?competencyId=pp1-counting-5-9"),
      {
        params: Promise.resolve({ classId: "class-1" }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when competencyId is missing", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/curriculum-evidence/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/curriculum-evidence"),
      {
        params: Promise.resolve({ classId: "class-1" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "competencyId is required",
    });
  });

  it("returns class curriculum evidence for the requested competency", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    listTeacherClassCurriculumEvidenceMock.mockResolvedValue([
      {
        learner: {
          id: "learner-1",
          classId: "class-1",
          userId: "user-1",
          name: "Asha",
          linkedAccount: true,
        },
        evidence: {
          competencyId: "pp1-counting-5-9",
          courseId: "course-math",
          gameId: "game-pp1-count-sets",
          rubricId: "pp1-counting-concrete-objects",
          evidenceType: "GAME_ATTEMPT",
          evidenceTarget: "Learner counts each object once and matches the set to the correct numeral.",
          latestEvidenceAt: "2026-05-30T10:00:00.000Z",
          attemptCount: 3,
          practicedQuantities: [5, 6, 7],
          correctQuantities: [5, 6],
          missedQuantities: [7, 8, 9],
          bestScore: 2,
          bestTimeMs: 4200,
          rubricLevel: "APPROACHES_EXPECTATION",
          supportLevel: "PROMPTS",
          interpretation: "Learner shows partial accuracy but still needs prompts on some quantities in the 5-9 range.",
          teacherObservationPrompts: [],
          teacherJudgement: {
            note: "Needed a prompt on 7.",
            rubricLevelOverride: null,
            supportLevelOverride: null,
            countedEachObjectOnce: true,
            skippedDoubleCounted: false,
            matchedNumeralCorrectly: false,
            neededPrompts: true,
            updatedAt: "2026-05-30T11:00:00.000Z",
          },
          teacherJudgementHistory: [
            {
              note: "Needed a prompt on 7.",
              rubricLevelOverride: null,
              supportLevelOverride: null,
              countedEachObjectOnce: true,
              skippedDoubleCounted: false,
              matchedNumeralCorrectly: false,
              neededPrompts: true,
              updatedAt: "2026-05-30T11:00:00.000Z",
              recordedAt: "2026-05-30T11:00:00.000Z",
            },
          ],
        },
      },
    ]);

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/curriculum-evidence/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/curriculum-evidence?competencyId=pp1-counting-5-9"),
      {
        params: Promise.resolve({ classId: "class-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(listTeacherClassCurriculumEvidenceMock).toHaveBeenCalledWith({
      ownerKey: "teacher_1",
      classId: "class-1",
      competencyId: "pp1-counting-5-9",
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        classId: "class-1",
        competencyId: "pp1-counting-5-9",
        evidence: expect.arrayContaining([
          expect.objectContaining({
            learner: expect.objectContaining({ id: "learner-1" }),
          }),
        ]),
      }),
    );
  });

  it("returns 503 when class evidence hydration times out", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    listTeacherClassCurriculumEvidenceMock.mockRejectedValue(
      new Error("teacher class curriculum evidence timed out"),
    );

    const { GET } = await import(
      "@/app/api/teach/class/[classId]/curriculum-evidence/route"
    );
    const response = await GET(
      new Request("http://localhost/api/teach/class/class-1/curriculum-evidence?competencyId=pp1-counting-5-9"),
      {
        params: Promise.resolve({ classId: "class-1" }),
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
