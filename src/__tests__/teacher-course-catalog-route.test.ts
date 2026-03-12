/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const listCoursesForTeacherWorkspaceMock = vi.fn();
const getFallbackCourseOverviewsMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/data", () => ({
  listCoursesForTeacherWorkspace: () => listCoursesForTeacherWorkspaceMock(),
  getFallbackCourseOverviews: () => getFallbackCourseOverviewsMock(),
}));

describe("GET /api/teach/course-catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
    delete (globalThis as { __teacherCourseCatalogState?: unknown })
      .__teacherCourseCatalogState;
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    getFallbackCourseOverviewsMock.mockReturnValue([
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
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as { __teacherCourseCatalogState?: unknown })
      .__teacherCourseCatalogState;
  });

  it("returns stale live courses immediately while a background refresh runs", async () => {
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
    listCoursesForTeacherWorkspaceMock
      .mockResolvedValueOnce(liveCourses)
      .mockImplementationOnce(
        () =>
          new Promise(() => {
            // Keep the refresh pending so the route must serve stale data immediately.
          }),
      );

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
    expect(listCoursesForTeacherWorkspaceMock).toHaveBeenCalledTimes(2);
  });

  it("returns fallback data when no live cache exists and the refresh exceeds the route timeout", async () => {
    listCoursesForTeacherWorkspaceMock.mockImplementationOnce(
      () =>
        new Promise(() => {
          // Keep the refresh pending so the route uses its faster timeout fallback.
        }),
    );

    const { GET } = await import("@/app/api/teach/course-catalog/route");
    const responsePromise = GET();

    await vi.advanceTimersByTimeAsync(451);
    const response = await responsePromise;

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
    expect(response.headers.get("x-teach-course-catalog-source")).toBe(
      "timeout-fallback",
    );
  });

  it("dedupes repeated cold refreshes behind one in-flight request", async () => {
    listCoursesForTeacherWorkspaceMock.mockImplementation(
      () =>
        new Promise(() => {
          // Hold the refresh open so both requests share the same promise.
        }),
    );

    const { GET } = await import("@/app/api/teach/course-catalog/route");
    const firstResponsePromise = GET();
    const secondResponsePromise = GET();

    await vi.advanceTimersByTimeAsync(451);

    const [firstResponse, secondResponse] = await Promise.all([
      firstResponsePromise,
      secondResponsePromise,
    ]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(listCoursesForTeacherWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(firstResponse.headers.get("x-teach-course-catalog-source")).toBe(
      "timeout-fallback",
    );
    expect(secondResponse.headers.get("x-teach-course-catalog-source")).toBe(
      "timeout-fallback",
    );
  });
});
