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
    const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/class/class-1/curriculum-evidence?")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            classId: "class-1",
            competencyId: "pp1-counting-5-9",
            evidence: [
              {
                learner: {
                  id: "learner-1",
                  classId: "class-1",
                  userId: "user-1",
                  name: "Asha Njeri",
                  linkedAccount: true,
                },
                evidence: {
                  competencyId: "pp1-counting-5-9",
                  courseId: "course-math",
                  gameId: "game-pp1-count-sets",
                  rubricId: "pp1-counting-concrete-objects",
                  evidenceType: "GAME_ATTEMPT",
                  evidenceTarget:
                    "Learner counts each object once and matches the set to the correct numeral.",
                  latestEvidenceAt: "2026-05-22T11:00:00.000Z",
                  attemptCount: 5,
                  practicedQuantities: [5, 6, 7, 8, 9],
                  correctQuantities: [5, 6, 7, 8, 9],
                  missedQuantities: [],
                  bestScore: 5,
                  bestTimeMs: 4200,
                  rubricLevel: "MEETS_EXPECTATION",
                  supportLevel: "NORMAL_INSTRUCTION",
                  interpretation:
                    "Learner matches PP1 counting sets correctly after normal instruction.",
                  teacherObservationPrompts: [],
                  teacherJudgement: {
                    note: null,
                    rubricLevelOverride: null,
                    supportLevelOverride: null,
                    countedEachObjectOnce: false,
                    skippedDoubleCounted: false,
                    matchedNumeralCorrectly: false,
                    neededPrompts: false,
                    updatedAt: null,
                  },
                  teacherJudgementHistory: [],
                },
              },
            ],
          }),
        });
      }

      if (requestUrl.includes("/dashboard")) {
        return Promise.resolve({
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
        });
      }

      if (requestUrl.includes("/curriculum-evidence/pp1-counting-5-9")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            competencyId: "pp1-counting-5-9",
            teacherJudgement: {
              note: "Counted five cups once and matched 5 without prompts.",
              rubricLevelOverride: null,
              supportLevelOverride: null,
              countedEachObjectOnce: false,
              skippedDoubleCounted: false,
              matchedNumeralCorrectly: true,
              neededPrompts: false,
              updatedAt: "2026-05-22T12:00:00.000Z",
            },
          }),
        });
      }

      return Promise.reject(
        new Error(`Unexpected fetch ${requestUrl} ${init?.method ?? "GET"}`),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TeacherWorkspaceClient
        initialWorkspace={makeWorkspace()}
        basePath="/teach"
      />,
    );

    expect(screen.getByText("Class PP1 counting evidence")).toBeInTheDocument();
    expect(screen.getByText("Count concrete object sets from 5 to 9")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open evidence/i })).toBeInTheDocument();
    expect(await screen.findByText("Teacher review")).toBeInTheDocument();
    expect(screen.getAllByText("5 / 5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Review needed")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /view progress/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teach/class/class-1/learner/learner-1/dashboard",
        { cache: "no-store" },
      ),
    );
    expect(await screen.findByText("Learner progress")).toBeInTheDocument();
    expect(screen.getAllByText("Asha Njeri").length).toBeGreaterThan(0);
    expect(screen.getByText("PP1 counting evidence")).toBeInTheDocument();
    expect(screen.getAllByText("game-pp1-count-sets").length).toBeGreaterThanOrEqual(
      2,
    );
    expect(screen.getAllByText("5 / 5").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText("counted each object once")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("matched numeral correctly"));
    await userEvent.type(
      screen.getByPlaceholderText("Teacher observation note"),
      "Counted five cups once and matched 5 without prompts.",
    );
    await userEvent.click(screen.getByRole("button", { name: /save evidence/i }));
    expect(screen.getByLabelText("matched numeral correctly")).toBeChecked();
    expect(screen.getByDisplayValue(/counted five cups once/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teach/class/class-1/learner/learner-1/curriculum-evidence/pp1-counting-5-9",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"matchedNumeralCorrectly":true'),
        }),
      ),
    );
    expect(await screen.findByText(/saved may 22/i)).toBeInTheDocument();
    expect(screen.getAllByText("Meets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Pattern Sorter")).toBeInTheDocument();
    expect(screen.getByText("AI Pattern Detectives / Sorting Rules")).toBeInTheDocument();
  });
});
