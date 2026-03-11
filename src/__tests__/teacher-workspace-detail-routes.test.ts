/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTeacherOwnerKeyMock = vi.fn();
const getTeacherWorkspaceSessionStatusesMock = vi.fn();
const getTeacherWorkspaceAssignmentsMock = vi.fn();

vi.mock("@/lib/server/teach-access", () => ({
  getTeacherOwnerKey: () => getTeacherOwnerKeyMock(),
}));

vi.mock("@/lib/server/teacher-store", () => ({
  getTeacherWorkspaceSessionStatuses: (...args: unknown[]) =>
    getTeacherWorkspaceSessionStatusesMock(...args),
  getTeacherWorkspaceAssignments: (...args: unknown[]) =>
    getTeacherWorkspaceAssignmentsMock(...args),
}));

describe("teacher workspace detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for session statuses when unauthorized", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/teach/workspace/session-statuses/route"
    );

    const response = await GET(
      new Request("http://localhost/api/teach/workspace/session-statuses"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns session statuses for authorized staff", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    getTeacherWorkspaceSessionStatusesMock.mockResolvedValue({
      sessionStatuses: { learner_1: "KEEP_GOING" },
    });

    const { GET } = await import(
      "@/app/api/teach/workspace/session-statuses/route"
    );

    const response = await GET(
      new Request(
        "http://localhost/api/teach/workspace/session-statuses?classId=class-1&activityId=activity-1",
      ),
    );

    expect(response.status).toBe(200);
    expect(getTeacherWorkspaceSessionStatusesMock).toHaveBeenCalledWith({
      ownerKey: "teacher_1",
      classId: "class-1",
      subjectId: undefined,
      strandId: undefined,
      activityId: "activity-1",
    });
    await expect(response.json()).resolves.toEqual({
      sessionStatuses: { learner_1: "KEEP_GOING" },
    });
  });

  it("returns assignments for authorized staff", async () => {
    getTeacherOwnerKeyMock.mockResolvedValue("teacher_1");
    getTeacherWorkspaceAssignmentsMock.mockResolvedValue({
      assignments: [],
      assignmentAnalytics: {
        totalAssignments: 0,
        recentAssignments24h: 0,
        assignedClassCount: 0,
        byTarget: { CLASS: 0, NEEDS_PRACTICE: 0 },
        byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      },
    });

    const { GET } = await import(
      "@/app/api/teach/workspace/assignments/route"
    );

    const response = await GET(
      new Request(
        "http://localhost/api/teach/workspace/assignments?classId=class-1",
      ),
    );

    expect(response.status).toBe(200);
    expect(getTeacherWorkspaceAssignmentsMock).toHaveBeenCalledWith({
      ownerKey: "teacher_1",
      classId: "class-1",
      subjectId: undefined,
      strandId: undefined,
      activityId: undefined,
    });
    await expect(response.json()).resolves.toEqual({
      assignments: [],
      assignmentAnalytics: {
        totalAssignments: 0,
        recentAssignments24h: 0,
        assignedClassCount: 0,
        byTarget: { CLASS: 0, NEEDS_PRACTICE: 0 },
        byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      },
    });
  });
});
