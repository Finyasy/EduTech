/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const ensureLearnerByIdWithTimeoutMock = vi.fn();
const getPrismaMock = vi.fn();
const parseJsonBodyMock = vi.fn();
const listLearnerArtifactsForLessonMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/server/auth", () => ({
  ensureLearnerByIdWithTimeout: (...args: unknown[]) =>
    ensureLearnerByIdWithTimeoutMock(...args),
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

vi.mock("@/lib/server/data", () => ({
  listLearnerArtifactsForLesson: (...args: unknown[]) =>
    listLearnerArtifactsForLessonMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

const request = (url: string) => new Request(url, { method: "POST" });

describe("authenticated write routes use bounded user lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: "user_1" });
    ensureLearnerByIdWithTimeoutMock.mockResolvedValue({
      status: "ok",
      user: {
        id: "user_1",
        email: "learner@example.com",
      },
    });
    listLearnerArtifactsForLessonMock.mockResolvedValue([]);
  });

  it("progress POST resolves the authenticated user by id with a timeout", async () => {
    const upsertMock = vi.fn().mockResolvedValue({});
    getPrismaMock.mockReturnValue({
      lessonProgress: { upsert: upsertMock },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { lessonId: "lesson-1", watchPercent: 75, completed: false },
    });

    const { POST } = await import("@/app/api/progress/route");
    const response = await POST(request("http://localhost/api/progress"));

    expect(response.status).toBe(200);
    expect(ensureLearnerByIdWithTimeoutMock).toHaveBeenCalledWith("user_1", 1_500);
    expect(upsertMock).toHaveBeenCalledOnce();
  });

  it("game attempt POST fails closed when bounded user lookup returns null", async () => {
    ensureLearnerByIdWithTimeoutMock.mockResolvedValue({
      status: "unauthorized",
      user: null,
    });
    getPrismaMock.mockReturnValue({
      gameLevel: { findUnique: vi.fn() },
      gameAttempt: { create: vi.fn() },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { gameLevelId: "level-1", score: 10, timeMs: 3000 },
    });

    const { POST } = await import("@/app/api/games/attempt/route");
    const response = await POST(request("http://localhost/api/games/attempt"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(ensureLearnerByIdWithTimeoutMock).toHaveBeenCalledWith("user_1", 1_500);
  });

  it("game best POST resolves the authenticated user by id with a timeout", async () => {
    const findUniqueMock = vi
      .fn()
      .mockResolvedValueOnce({ id: "game-1" })
      .mockResolvedValueOnce(null);
    const createMock = vi.fn().mockResolvedValue({
      bestScore: 15,
      bestTimeMs: 2000,
    });
    getPrismaMock.mockReturnValue({
      game: { findUnique: findUniqueMock },
      gameBest: {
        findUnique: findUniqueMock,
        create: createMock,
      },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { gameId: "game-1", bestScore: 15, bestTimeMs: 2000 },
    });

    const { POST } = await import("@/app/api/games/best/route");
    const response = await POST(request("http://localhost/api/games/best"));

    expect(response.status).toBe(200);
    expect(ensureLearnerByIdWithTimeoutMock).toHaveBeenCalledWith("user_1", 1_500);
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("quiz submit POST resolves the authenticated user by id before saving", async () => {
    getPrismaMock.mockReturnValue({
      lesson: { findFirst: vi.fn().mockResolvedValue({ id: "lesson-1" }) },
      quizQuestion: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "question-1",
            type: "MULTIPLE_CHOICE",
            answer: "A",
            explanation: "Because A.",
          },
        ]),
      },
      quizAttempt: { create: vi.fn().mockResolvedValue({}) },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        lessonId: "lesson-1",
        answers: [{ questionId: "question-1", answer: "A" }],
      },
    });

    const { POST } = await import("@/app/api/quiz/submit/route");
    const response = await POST(request("http://localhost/api/quiz/submit"));

    expect(response.status).toBe(200);
    expect(ensureLearnerByIdWithTimeoutMock).toHaveBeenCalledWith("user_1", 1_500);
  });

  it("artifact POST resolves the authenticated user by id with a timeout", async () => {
    const createMock = vi.fn().mockResolvedValue({
      id: "artifact-1",
      userId: "user_1",
      lessonId: "lesson-1",
      title: "Robot plan",
      buildType: "Sketch",
      reflection: "I learned how to explain the pattern.",
      artifactUrl: null,
      status: "SUBMITTED",
      createdAt: new Date("2026-05-21T00:00:00.000Z"),
      user: {
        id: "user_1",
        email: "learner@example.com",
        name: "Learner One",
      },
      lesson: {
        id: "lesson-1",
        title: "Patterns",
        courseId: "course-1",
        course: { id: "course-1", title: "AI Patterns" },
      },
    });
    getPrismaMock.mockReturnValue({
      lesson: {
        findUnique: vi.fn().mockResolvedValue({
          id: "lesson-1",
          title: "Patterns",
          courseId: "course-1",
          course: { title: "AI Patterns" },
        }),
      },
      learnerArtifact: { create: createMock },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        lessonId: "lesson-1",
        title: "Robot plan",
        buildType: "Sketch",
        reflection: "I learned how to explain the pattern.",
        artifactUrl: "",
      },
    });

    const { POST } = await import("@/app/api/artifacts/route");
    const response = await POST(request("http://localhost/api/artifacts"));

    expect(response.status).toBe(200);
    expect(ensureLearnerByIdWithTimeoutMock).toHaveBeenCalledWith("user_1", 1_500);
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("progress POST returns 403 for a teacher account", async () => {
    ensureLearnerByIdWithTimeoutMock.mockResolvedValue({
      status: "forbidden",
      user: null,
    });
    getPrismaMock.mockReturnValue({
      lessonProgress: { upsert: vi.fn() },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { lessonId: "lesson-1", watchPercent: 75, completed: false },
    });

    const { POST } = await import("@/app/api/progress/route");
    const response = await POST(request("http://localhost/api/progress"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("progress POST returns 503 when the write times out", async () => {
    vi.useFakeTimers();
    getPrismaMock.mockReturnValue({
      lessonProgress: { upsert: vi.fn().mockReturnValue(new Promise(() => {})) },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { lessonId: "lesson-1", watchPercent: 75, completed: false },
    });

    const { POST } = await import("@/app/api/progress/route");
    const responsePromise = POST(request("http://localhost/api/progress"));

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });

  it("game attempt POST returns 503 when the level lookup times out", async () => {
    vi.useFakeTimers();
    getPrismaMock.mockReturnValue({
      gameLevel: { findUnique: vi.fn().mockReturnValue(new Promise(() => {})) },
      gameAttempt: { create: vi.fn() },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: { gameLevelId: "level-1", score: 10, timeMs: 3000 },
    });

    const { POST } = await import("@/app/api/games/attempt/route");
    const responsePromise = POST(request("http://localhost/api/games/attempt"));

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });

  it("artifact POST returns 503 when the create call times out", async () => {
    vi.useFakeTimers();
    getPrismaMock.mockReturnValue({
      lesson: {
        findUnique: vi.fn().mockResolvedValue({
          id: "lesson-1",
          title: "Patterns",
          courseId: "course-1",
          course: { title: "AI Patterns" },
        }),
      },
      learnerArtifact: {
        create: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        lessonId: "lesson-1",
        title: "Robot plan",
        buildType: "Sketch",
        reflection: "I learned how to explain the pattern.",
        artifactUrl: "",
      },
    });

    const { POST } = await import("@/app/api/artifacts/route");
    const responsePromise = POST(request("http://localhost/api/artifacts"));

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });

  it("artifact GET returns 503 when the learner artifact list times out", async () => {
    listLearnerArtifactsForLessonMock.mockRejectedValue(
      new Error("learner artifact list timed out"),
    );

    const { GET } = await import("@/app/api/artifacts/route");
    const response = await GET(
      new Request("http://localhost/api/artifacts?lessonId=lesson-1"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
