/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffMock = vi.fn();
const getPrismaMock = vi.fn();
const parseJsonBodyMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("@/lib/server/auth", () => ({
  requireStaff: (...args: unknown[]) => requireStaffMock(...args),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => getPrismaMock(),
}));

vi.mock("@/lib/server/request", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/request")>();
  return {
    ...actual,
    parseJsonBody: (...args: unknown[]) => parseJsonBodyMock(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

const request = () =>
  new Request("http://localhost/api/teach/artifacts/artifact-1/score", {
    method: "POST",
  });

const params = { params: Promise.resolve({ artifactId: "artifact-1" }) };

describe("teacher artifact scoring route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffMock.mockResolvedValue({
      ok: true,
      user: { id: "teacher_1", role: "TEACHER" },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        scores: { ai: 3, coding: 2, math: 4 },
        feedback: "Good explanation and evidence.",
      },
    });
  });

  it("upserts rubric scores and marks the artifact reviewed", async () => {
    const findFirstMock = vi.fn().mockResolvedValue({ id: "rubric-1" });
    const upsertMock = vi.fn().mockResolvedValue({});
    const updateMock = vi.fn().mockResolvedValue({
      id: "artifact-1",
      userId: "user_1",
      status: "REVIEWED",
    });
    const transactionMock = vi.fn(async (callback) =>
      callback({
        learnerArtifact: {
          findUnique: vi.fn().mockResolvedValue({
            id: "artifact-1",
            userId: "user_1",
          }),
          update: updateMock,
        },
        masteryRubric: {
          findFirst: findFirstMock,
          create: vi.fn(),
        },
        masteryScore: {
          upsert: upsertMock,
        },
      }),
    );
    getPrismaMock.mockReturnValue({ $transaction: transactionMock });

    const { POST } = await import("@/app/api/teach/artifacts/[artifactId]/score/route");
    const response = await POST(request(), params);

    expect(response.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledTimes(3);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "artifact-1" },
      data: { status: "REVIEWED" },
      select: { id: true, userId: true, status: true },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith("dashboard-stats:user_1", {
      expire: 0,
    });
  });

  it("returns 404 when the artifact is missing", async () => {
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn(async (callback) =>
        callback({
          learnerArtifact: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        }),
      ),
    });

    const { POST } = await import("@/app/api/teach/artifacts/[artifactId]/score/route");
    const response = await POST(request(), params);

    expect(response.status).toBe(404);
  });

  it("returns 503 when the scoring transaction times out", async () => {
    vi.useFakeTimers();
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const { POST } = await import("@/app/api/teach/artifacts/[artifactId]/score/route");
    const responsePromise = POST(request(), params);

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
