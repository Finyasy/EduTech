import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeacherWorkspaceRouteShell from "@/components/teacher/TeacherWorkspaceRouteShell";
import type { CourseOverview } from "@/lib/server/data";
import type { TeacherWorkspaceSnapshot } from "@/lib/teacher/types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("classId=class-1"),
}));

vi.mock("@/components/teacher/TeacherWorkspaceClient", () => ({
  default: ({
    basePath,
    initialWorkspace,
    courseCatalog = [],
  }: {
    basePath?: string;
    initialWorkspace: TeacherWorkspaceSnapshot;
    courseCatalog?: CourseOverview[];
  }) => (
    <div data-testid="teacher-workspace-client">
      <span data-testid="base-path">{basePath}</span>
      <span data-testid="school-name">{initialWorkspace.school.schoolName}</span>
      <span data-testid="course-count">{courseCatalog.length}</span>
    </div>
  ),
}));

const makeCourseCatalog = (): CourseOverview[] => [
  {
    id: "course-logic",
    title: "AI Pattern Detectives",
    description: "Mission-aligned course",
    gradeLevel: "Ages 5-7",
    lessonCount: 3,
    firstLessonId: "lesson-1",
  },
];

const makeWorkspace = (
  overrides: Partial<TeacherWorkspaceSnapshot> = {},
): TeacherWorkspaceSnapshot => ({
  classes: [],
  archivedClasses: [],
  activeClassId: null,
  subjects: [],
  strands: [],
  activities: [],
  sessionActivityId: null,
  learners: [],
  sessionStatuses: {},
  weeklySummary: { thisWeekMinutes: 0, lastWeekMinutes: 0 },
  learnerUsage: [],
  assignments: [],
  assignmentAnalytics: {
    totalAssignments: 0,
    recentAssignments24h: 0,
    assignedClassCount: 0,
    byTarget: { CLASS: 0, NEEDS_PRACTICE: 0 },
    byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
  },
  school: {
    schoolName: "Kwa Njenga",
    country: "Kenya",
    schoolQrCode: "QR-123",
    connectivityStatus: "OKAY",
    contentStatus: "UP_TO_DATE",
    appVersion: "1.0.0",
    deviceId: "lb-test",
    supportEmail: "support@example.com",
  },
  isFallbackData: false,
  ...overrides,
});

describe("TeacherWorkspaceRouteShell", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads workspace and shows fallback badge when fallback data is returned", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/teach/course-catalog")) {
        return Promise.resolve({
          ok: true,
          json: async () => makeCourseCatalog(),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => makeWorkspace({ isFallbackData: true }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherWorkspaceRouteShell basePath="/teach" />);

    expect(
      await screen.findByText(/data may be delayed\. showing fallback classroom data/i),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("teacher-workspace-client")).toBeInTheDocument();
    expect(screen.getByTestId("base-path")).toHaveTextContent("/teach");
    expect(screen.getByTestId("school-name")).toHaveTextContent("Kwa Njenga");
    expect(screen.getByTestId("course-count")).toHaveTextContent("1");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teach/workspace?classId=class-1",
        expect.objectContaining({ cache: "no-store" }),
      ),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teach/course-catalog",
        expect.objectContaining({ cache: "no-store" }),
      ),
    );
  });

  it("shows retry UI on failure and recovers on retry", async () => {
    let workspaceAttempts = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/teach/course-catalog")) {
        return Promise.resolve({
          ok: true,
          json: async () => makeCourseCatalog(),
        });
      }

      workspaceAttempts += 1;
      if (workspaceAttempts === 1) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Teacher API offline" }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => makeWorkspace(),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TeacherWorkspaceRouteShell basePath="/admin/teach" />);

    expect(await screen.findByText("Teacher API offline")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retry);

    expect(await screen.findByTestId("teacher-workspace-client")).toBeInTheDocument();
    expect(screen.getByTestId("base-path")).toHaveTextContent("/admin/teach");
    expect(screen.getByTestId("course-count")).toHaveTextContent("1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows timeout message when workspace fetch is aborted", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/teach/course-catalog")) {
          return Promise.resolve({
            ok: true,
            json: async () => makeCourseCatalog(),
          });
        }
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const abortError = new Error("Aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        });
      }),
    );

    render(<TeacherWorkspaceRouteShell basePath="/teach" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5001);
      await Promise.resolve();
    });

    expect(
      screen.getByText(/teacher workspace is taking too long to load\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("falls back to a generic message for non-Error fetch failures", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/teach/course-catalog")) {
        return Promise.resolve({
          ok: true,
          json: async () => makeCourseCatalog(),
        });
      }
      return Promise.reject("network-down");
    }));

    render(<TeacherWorkspaceRouteShell basePath="/teach" />);

    expect(
      await screen.findByText("Unable to load teacher workspace."),
    ).toBeInTheDocument();
  });
});
