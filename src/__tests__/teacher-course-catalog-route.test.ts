/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const listCoursesForTeacherWorkspaceMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/data", () => ({
  listCoursesForTeacherWorkspace: () => listCoursesForTeacherWorkspaceMock(),
}));

describe("GET /api/teach/course-catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns stale live courses when a refresh stalls past the timeout", async () => {
    const liveCourses = [
      {
        id: "course-live",
        title: "Live course",
        description: "Live",
        gradeLevel: "PP1",
        lessonCount: 2,
        firstLessonId: "lesson-live",
      },
    ];
    const fallbackCourses = [
      {
        id: "course-fallback",
        title: "Fallback course",
        description: "Fallback",
        gradeLevel: "PP1",
        lessonCount: 1,
        firstLessonId: "lesson-fallback",
        isFallbackData: true,
      },
    ];

    listCoursesForTeacherWorkspaceMock
      .mockResolvedValueOnce(liveCourses)
      .mockResolvedValueOnce(fallbackCourses);

    const { GET } = await import("@/app/api/teach/course-catalog/route");

    const firstResponse = await GET();
    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual(liveCourses);
    expect(firstResponse.headers.get("x-teach-course-catalog-source")).toBe("live");

    await vi.advanceTimersByTimeAsync(60_001);

    const secondResponse = await GET();

    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual(liveCourses);
    expect(secondResponse.headers.get("x-teach-course-catalog-source")).toBe(
      "stale-live",
    );
  });

  it("returns fallback data when no live cache exists and the refresh times out", async () => {
    listCoursesForTeacherWorkspaceMock.mockResolvedValueOnce([
      {
        id: "course-fallback",
        title: "Fallback course",
        description: "Fallback",
        gradeLevel: "PP1",
        lessonCount: 1,
        firstLessonId: "lesson-fallback",
        isFallbackData: true,
      },
    ]);

    const { GET } = await import("@/app/api/teach/course-catalog/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        id: "course-fallback",
        title: "Fallback course",
        description: "Fallback",
        gradeLevel: "PP1",
        lessonCount: 1,
        firstLessonId: "lesson-fallback",
        isFallbackData: true,
      },
    ]);
    expect(response.headers.get("x-teach-course-catalog-source")).toBe("fallback");
  });
});
