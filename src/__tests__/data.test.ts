import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PP1_COUNT_THE_SET_LEVELS } from "@/lib/curriculum/math-roadmap";
import {
  getCourse,
  getGameWithLevels,
  listCourses,
  listCoursesForTeacherWorkspace,
  listGames,
} from "@/lib/server/data";
import { courses, games, getCourseLessons } from "@/lib/server/mock-data";

const originalDatabaseUrl = process.env.DATABASE_URL;

describe("server data (mock fallback)", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("lists mock courses with lesson counts and first lesson", async () => {
    const result = await listCourses();

    expect(result).toHaveLength(courses.length);
    expect(result[0]?.lessonCount).toBeGreaterThan(0);

    const firstCourse = courses[0];
    const lessons = getCourseLessons(firstCourse.id);
    expect(result[0]?.firstLessonId).toBe(lessons[0]?.id ?? null);
  });

  it("returns a mock course by id", async () => {
    const result = await getCourse("course-logic");

    expect(result?.id).toBe("course-logic");
    expect(result?.title).toBe("AI Pattern Detectives");
  });

  it("lists teacher workspace courses from fallback data without a database", async () => {
    const result = await listCoursesForTeacherWorkspace();

    expect(result).toHaveLength(courses.length);
    expect(result.every((course) => course.isFallbackData)).toBe(true);
  });

  it("lists mock games", async () => {
    const result = await listGames();

    expect(result).toHaveLength(games.length);
    expect(result[0]?.id).toBe(games[0]?.id);
    expect(result.map((game) => game.id)).toContain("game-pp1-count-sets");
  });

  it("returns game levels for mock game", async () => {
    const result = await getGameWithLevels("game-logic-quest");

    expect(result?.levels.length).toBeGreaterThan(0);
    expect(result?.game.id).toBe("game-logic-quest");
  });

  it("returns PP1 counting game levels for the maths vertical slice", async () => {
    const result = await getGameWithLevels("game-pp1-count-sets");

    expect(result?.game.title).toBe("PP1 Count The Set");
    expect(result?.levels).toHaveLength(PP1_COUNT_THE_SET_LEVELS.length);
    expect(result?.levels.map((level) => level.id)).toEqual(
      PP1_COUNT_THE_SET_LEVELS.map((level) => level.id),
    );
    expect(result?.levels[0]?.configJson.answer).toBe(
      PP1_COUNT_THE_SET_LEVELS[0]?.answer,
    );
  });
});

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});
