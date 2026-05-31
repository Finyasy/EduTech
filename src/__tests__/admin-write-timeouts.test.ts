/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getPrismaMock = vi.fn();
const parseJsonBodyMock = vi.fn();

vi.mock("@/lib/server/auth", () => ({
  requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
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
  revalidateTag: vi.fn(),
}));

describe("admin write route timeouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      ok: true,
      user: { id: "admin_1", role: "ADMIN" },
    });
  });

  it("returns 503 when course creation times out", async () => {
    vi.useFakeTimers();
    getPrismaMock.mockReturnValue({
      course: {
        create: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        title: "AI Builders",
        description: "Learn AI through projects.",
        gradeLevel: "Grade 5",
      },
    });

    const { POST } = await import("@/app/api/admin/course/route");
    const responsePromise = POST(
      new Request("http://localhost/api/admin/course", { method: "POST" }),
    );

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });

  it("returns 503 when lesson deletion transaction times out", async () => {
    vi.useFakeTimers();
    getPrismaMock.mockReturnValue({
      lesson: {
        findUnique: vi.fn().mockResolvedValue({ id: "lesson-1", courseId: "course-1" }),
        delete: vi.fn(),
      },
      quizAttempt: { deleteMany: vi.fn() },
      lessonProgress: { deleteMany: vi.fn() },
      quizQuestion: { deleteMany: vi.fn() },
      $transaction: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const { DELETE } = await import("@/app/api/admin/lesson/[lessonId]/route");
    const responsePromise = DELETE(
      new Request("http://localhost/api/admin/lesson/lesson-1", { method: "DELETE" }),
      { params: Promise.resolve({ lessonId: "lesson-1" }) },
    );

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
