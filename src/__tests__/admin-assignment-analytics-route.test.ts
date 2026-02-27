/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getTeacherAssignmentAnalyticsReportMock = vi.fn();

vi.mock("@/lib/server/auth", () => ({
  requireAdmin: () => requireAdminMock(),
}));

vi.mock("@/lib/server/teacher-store", () => ({
  getTeacherAssignmentAnalyticsReport: (...args: unknown[]) =>
    getTeacherAssignmentAnalyticsReportMock(...args),
}));

describe("GET /api/admin/teach/assignment-analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when admin is not authenticated", async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 401 });

    const { GET } = await import("@/app/api/admin/teach/assignment-analytics/route");
    const response = await GET(
      new Request("http://localhost/api/admin/teach/assignment-analytics"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid date range", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: "admin" } });

    const { GET } = await import("@/app/api/admin/teach/assignment-analytics/route");
    const response = await GET(
      new Request(
        "http://localhost/api/admin/teach/assignment-analytics?dateFrom=2026-03-02&dateTo=2026-03-01",
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "dateFrom must be before or equal to dateTo.",
    });
  });

  it("returns analytics report with filters", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: { id: "admin" } });
    getTeacherAssignmentAnalyticsReportMock.mockResolvedValue({
      filters: {
        ownerKey: "user_1",
        classId: "class-1",
        target: "CLASS",
        dateFrom: "2026-02-01T00:00:00.000Z",
        dateTo: "2026-02-28T23:59:59.000Z",
      },
      summary: {
        totalAssignments: 2,
        recentAssignments24h: 1,
        assignedClassCount: 1,
        byTarget: { CLASS: 2, NEEDS_PRACTICE: 0 },
        byStatus: { ASSIGNED: 1, IN_PROGRESS: 1, COMPLETED: 0 },
      },
      byClass: [],
      byDay: [],
    });

    const { GET } = await import("@/app/api/admin/teach/assignment-analytics/route");
    const response = await GET(
      new Request(
        "http://localhost/api/admin/teach/assignment-analytics?ownerKey=user_1&classId=class-1&target=CLASS&dateFrom=2026-02-01&dateTo=2026-02-28",
      ),
    );

    expect(response.status).toBe(200);
    expect(getTeacherAssignmentAnalyticsReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerKey: "user_1",
        classId: "class-1",
        target: "CLASS",
      }),
    );
    const payload = await response.json();
    expect(payload.summary.totalAssignments).toBe(2);
  });
});
