import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listCourses, listGames, getCourse, getGameWithLevels } from "@/lib/server/data";
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
    expect(result?.title).toBe("Logic Explorers");
  });

  it("lists mock games", async () => {
    const result = await listGames();

    expect(result).toHaveLength(games.length);
    expect(result[0]?.id).toBe(games[0]?.id);
  });

  it("returns game levels for mock game", async () => {
    const result = await getGameWithLevels("game-logic-quest");

    expect(result?.levels.length).toBeGreaterThan(0);
    expect(result?.game.id).toBe("game-logic-quest");
  });
});

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});
