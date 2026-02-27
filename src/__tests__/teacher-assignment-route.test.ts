/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const parseJsonBodyMock = vi.fn();
const assignTeacherMissionToClassMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/request", () => ({
  parseJsonBody: (...args: unknown[]) => parseJsonBodyMock(...args),
}));

vi.mock("@/lib/server/teacher-store", () => ({
  assignTeacherMissionToClass: (...args: unknown[]) =>
    assignTeacherMissionToClassMock(...args),
}));

describe("POST /api/teach/class/[classId]/assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authorized", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/teach/class/[classId]/assignment/route");
    const response = await POST(new Request("http://localhost/api/teach/class/x/assignment", { method: "POST" }), {
      params: Promise.resolve({ classId: "class-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 on invalid payload", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("user_1");
    parseJsonBodyMock.mockResolvedValue({ ok: true, data: { courseId: "course-1" } });

    const { POST } = await import("@/app/api/teach/class/[classId]/assignment/route");
    const response = await POST(new Request("http://localhost/api/teach/class/x/assignment", { method: "POST" }), {
      params: Promise.resolve({ classId: "class-1" }),
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Invalid payload");
  });

  it("creates assignment and returns 201", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("user_1");
    parseJsonBodyMock.mockResolvedValue({
      ok: true,
      data: {
        courseId: "course-logic",
        courseTitle: "AI Pattern Detectives",
        target: "CLASS",
        subjectId: "subject-math",
        strandId: "strand-pre-number",
        activityId: "activity-sorting-grouping",
      },
    });
    assignTeacherMissionToClassMock.mockResolvedValue({ id: "assignment-1" });

    const { POST } = await import("@/app/api/teach/class/[classId]/assignment/route");
    const response = await POST(new Request("http://localhost/api/teach/class/x/assignment", { method: "POST" }), {
      params: Promise.resolve({ classId: "class-1" }),
    });

    expect(response.status).toBe(201);
    expect(assignTeacherMissionToClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerKey: "user_1",
        classId: "class-1",
        courseId: "course-logic",
        target: "CLASS",
      }),
    );
    await expect(response.json()).resolves.toEqual({ assignment: { id: "assignment-1" } });
  });
});
