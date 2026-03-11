/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const listCoursesMock = vi.fn();
const getFallbackCourseOverviewsMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/data", () => ({
  listCourses: () => listCoursesMock(),
  getFallbackCourseOverviews: () => getFallbackCourseOverviewsMock(),
}));

describe("GET /api/teach/course-catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
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

    listCoursesMock.mockResolvedValueOnce(liveCourses);

    const { GET } = await import("@/app/api/teach/course-catalog/route");

    const firstResponse = await GET();
    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual(liveCourses);
    expect(firstResponse.headers.get("x-teach-course-catalog-source")).toBe("live");

    await vi.advanceTimersByTimeAsync(60_001);

    listCoursesMock.mockReturnValueOnce(new Promise(() => {}));

    const secondResponsePromise = GET();
    await vi.advanceTimersByTimeAsync(1_201);
    const secondResponse = await secondResponsePromise;

    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual(liveCourses);
    expect(secondResponse.headers.get("x-teach-course-catalog-source")).toBe(
      "stale-live",
    );
  });

  it("returns fallback data when no live cache exists and the refresh times out", async () => {
    listCoursesMock.mockReturnValueOnce(new Promise(() => {}));

    const { GET } = await import("@/app/api/teach/course-catalog/route");
    const responsePromise = GET();

    await vi.advanceTimersByTimeAsync(1_201);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      getFallbackCourseOverviewsMock(),
    );
    expect(response.headers.get("x-teach-course-catalog-source")).toBe(
      "timeout-fallback",
    );
  });
});
