import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherWorkspaceClient from "@/components/teacher/TeacherWorkspaceClient";
import type { TeacherWorkspaceSnapshot } from "@/lib/teacher/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/teach/learners",
}));

const makeWorkspace = (): TeacherWorkspaceSnapshot => ({
  isFallbackData: false,
  school: {
    schoolName: "Kwa Njenga",
    country: "Kenya",
    appVersion: "1.0.0",
    deviceId: "lb-test",
    connectivityStatus: "OKAY",
    contentStatus: "UP_TO_DATE",
    supportEmail: "support@example.com",
    schoolQrCode: "QR-123",
  },
  classes: [
    {
      id: "class-1",
      name: "PP1 Mary",
      grade: "PP1",
      teacherName: "Mary Wanjiru",
      teacherPhone: "+254700000001",
      cardColor: "bg-sky-50",
      isArchived: false,
      createdAt: "2026-05-22T10:00:00.000Z",
      updatedAt: "2026-05-22T10:00:00.000Z",
    },
  ],
  archivedClasses: [],
  activeClassId: "class-1",
  learners: [
    {
      id: "learner-1",
      classId: "class-1",
      userId: "user-1",
      name: "Asha Njeri",
      avatarHue: 210,
      weeklyMinutes: 32,
      lastWeekMinutes: 18,
      createdAt: "2026-05-22T10:00:00.000Z",
    },
  ],
  subjects: [],
  strands: [],
  activities: [],
  sessionActivityId: null,
  sessionStatuses: {},
  weeklySummary: { thisWeekMinutes: 32, lastWeekMinutes: 18 },
  learnerUsage: [],
  assignments: [],
  assignmentAnalytics: {
    totalAssignments: 0,
    recentAssignments24h: 0,
    assignedClassCount: 0,
    byTarget: { CLASS: 0, NEEDS_PRACTICE: 0 },
    byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
  },
});

describe("TeacherWorkspaceClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads learner dashboard details from the learners tab", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          learner: {
            id: "learner-1",
            classId: "class-1",
            userId: "user-1",
            name: "Asha Njeri",
            linkedAccount: true,
          },
          dashboard: {
            continueWatching: null,
            completedTotal: 4,
            completedThisWeek: 2,
            streakDays: 2,
            mastery: { ai: 60, coding: 50, math: 55 },
          },
          quiz: {
            attemptCount: 3,
            averageScore: 4.5,
            latestScore: 5,
            latestSubmittedAt: "2026-05-22T10:00:00.000Z",
          },
          games: {
            attemptCount: 7,
            bestRecordCount: 2,
            bestScore: 18,
            latestSubmittedAt: "2026-05-22T11:00:00.000Z",
          },
          artifacts: {
            totalCount: 2,
            reviewedCount: 1,
            recent: [
              {
                id: "artifact-1",
                userId: "user-1",
                learnerName: "Asha Njeri",
                learnerEmail: "asha@example.com",
                lessonId: "lesson-1",
                lessonTitle: "Sorting Rules",
                courseId: "course-logic",
                courseTitle: "AI Pattern Detectives",
                title: "Pattern Sorter",
                buildType: "MODEL",
                reflection: "I sorted by shape.",
                artifactUrl: null,
                status: "REVIEWED",
                createdAt: "2026-05-22T10:00:00.000Z",
              },
            ],
          },
        }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TeacherWorkspaceClient
        initialWorkspace={makeWorkspace()}
        basePath="/teach"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /view progress/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teach/class/class-1/learner/learner-1/dashboard",
        { cache: "no-store" },
      ),
    );
    expect(await screen.findByText("Learner progress")).toBeInTheDocument();
    expect(screen.getAllByText("Asha Njeri").length).toBeGreaterThan(0);
    expect(screen.getByText("Pattern Sorter")).toBeInTheDocument();
    expect(screen.getByText("AI Pattern Detectives / Sorting Rules")).toBeInTheDocument();
  });
});
