import { describe, expect, it } from "vitest";
import {
  buildTeacherAlignmentRecommendations,
  compareCoursesByCurriculumPlan,
  getLearnerBadgesFromStats,
  getLearnerRecommendationFromStats,
} from "@/lib/curriculum/learning-path";

const catalog = [
  {
    id: "course-logic",
    title: "AI Pattern Detectives",
    ageBand: "5-7" as const,
    pathwayStage: "Explorer" as const,
  },
  {
    id: "course-safari",
    title: "Sound Sorting Safari",
    ageBand: "5-7" as const,
    pathwayStage: "Explorer" as const,
  },
  {
    id: "course-math",
    title: "Robot Coders Math Lab",
    ageBand: "8-10" as const,
    pathwayStage: "Builder" as const,
  },
  {
    id: "course-story",
    title: "Story Chatbot Studio",
    ageBand: "11-14" as const,
    pathwayStage: "Creator" as const,
  },
];

describe("learning-path curriculum helpers", () => {
  it("ranks teacher alignment recommendations from data-driven rules", () => {
    const result = buildTeacherAlignmentRecommendations({
      courseCatalog: catalog,
      subjectId: "subject-math",
      strandId: "strand-pre-number",
      activityId: "activity-sorting-grouping",
    });

    expect(result.length).toBeGreaterThan(1);
    expect(result[0]?.course.id).toBe("course-logic");
    expect(result.map((item) => item.course.id)).toContain("course-safari");
    expect(result[0]?.confidence).toMatch(/fit/i);
    expect(result[0]?.reasons.length).toBeGreaterThan(0);
  });

  it("sorts course catalog according to curriculum sequence", () => {
    const sorted = [...catalog].sort(compareCoursesByCurriculumPlan);
    expect(sorted.map((course) => course.id)).toEqual([
      "course-logic",
      "course-safari",
      "course-math",
      "course-story",
    ]);
  });

  it("recommends resume mission when continue watching exists", () => {
    const recommendation = getLearnerRecommendationFromStats({
      completedTotal: 2,
      completedThisWeek: 1,
      streakDays: 1,
      continueWatching: {
        courseId: "course-math",
        courseTitle: "Robot Coders Math Lab",
        href: "/courses/course-math/lessons/lesson-math-1",
      },
    });

    expect(recommendation.courseId).toBe("course-math");
    expect(recommendation.href).toContain("/courses/course-math/");
    expect(recommendation.reason).toMatch(/finish your current mission/i);
  });

  it("returns badge recommendations for streak and weekly completion", () => {
    const badges = getLearnerBadgesFromStats({
      completedTotal: 6,
      completedThisWeek: 3,
      streakDays: 7,
      continueWatching: null,
    });

    expect(badges.map((badge) => badge.label)).toEqual(
      expect.arrayContaining(["7-Day Streak", "Weekly Finisher", "Mission Builder"]),
    );
  });
});
