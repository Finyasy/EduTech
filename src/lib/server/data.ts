import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPrisma } from "@/lib/server/prisma";
import {
  courses as mockCourses,
  getCourse as getMockCourse,
  getLesson as getMockLesson,
  getCourseLessons as getMockCourseLessons,
  games as mockGames,
  getGame as getMockGame,
  getGameLevels as getMockGameLevels,
} from "@/lib/server/mock-data";

export type CourseOverview = {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  lessonCount: number;
  firstLessonId: string | null;
};

export type LessonDetail = {
  id: string;
  courseId: string;
  title: string;
  videoId: string;
  order: number;
  notes: string;
};

export type QuizQuestionDetail = {
  id: string;
  lessonId: string;
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
};

const hasDatabase = () =>
  Boolean(process.env.DATABASE_URL && getPrisma());

async function listCoursesUncached(): Promise<CourseOverview[]> {
  if (!hasDatabase()) {
    return mockCourses.map((course) => {
      const courseLessons = getMockCourseLessons(course.id);
      return {
        ...course,
        lessonCount: courseLessons.length,
        firstLessonId: courseLessons[0]?.id ?? null,
      };
    });
  }

  const prisma = getPrisma()!;
  const dbCourses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        select: { id: true },
      },
    },
    orderBy: { title: "asc" },
  });
  return dbCourses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    gradeLevel: course.gradeLevel,
    lessonCount: course.lessons.length,
    firstLessonId: course.lessons[0]?.id ?? null,
  }));
}

async function getCourseUncached(courseId: string) {
  if (!hasDatabase()) {
    return getMockCourse(courseId) ?? null;
  }

  const prisma = getPrisma()!;
  return prisma.course.findFirst({
    where: { id: courseId },
  });
}

async function getLessonUncached(
  lessonId: string,
): Promise<LessonDetail | null> {
  if (!hasDatabase()) {
    return getMockLesson(lessonId) ?? null;
  }

  const prisma = getPrisma()!;
  return prisma.lesson.findFirst({
    where: { id: lessonId },
  });
}

async function listLessonsUncached(courseId: string): Promise<LessonDetail[]> {
  if (!hasDatabase()) {
    return getMockCourseLessons(courseId);
  }

  const prisma = getPrisma()!;
  return prisma.lesson.findMany({
    where: { courseId, isPublished: true },
    orderBy: { order: "asc" },
  });
}

export type CourseForAdmin = CourseOverview & { isPublished: boolean };
export type LessonForAdmin = LessonDetail & { isPublished: boolean };

export async function listCoursesForAdmin(): Promise<CourseForAdmin[]> {
  if (!hasDatabase()) return [];

  const prisma = getPrisma()!;
  const dbCourses = await prisma.course.findMany({
    include: {
      lessons: { orderBy: { order: "asc" }, select: { id: true, isPublished: true } },
    },
    orderBy: { title: "asc" },
  });
  return dbCourses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    gradeLevel: course.gradeLevel,
    lessonCount: course.lessons.length,
    firstLessonId: course.lessons[0]?.id ?? null,
    isPublished: course.isPublished,
  }));
}

export async function getCourseForAdmin(
  courseId: string,
): Promise<CourseForAdmin | null> {
  if (!hasDatabase()) return null;

  const prisma = getPrisma()!;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { select: { id: true } } },
  });
  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    gradeLevel: course.gradeLevel,
    lessonCount: course.lessons.length,
    firstLessonId: course.lessons[0]?.id ?? null,
    isPublished: course.isPublished,
  };
}

export async function listLessonsForAdmin(
  courseId: string,
): Promise<LessonForAdmin[]> {
  if (!hasDatabase()) return [];

  const prisma = getPrisma()!;
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });
  return lessons.map((lesson) => ({
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    videoId: lesson.videoId,
    order: lesson.order,
    notes: lesson.notes,
    isPublished: lesson.isPublished,
  }));
}

export async function getLessonForAdmin(
  lessonId: string,
): Promise<LessonForAdmin | null> {
  if (!hasDatabase()) return null;

  const prisma = getPrisma()!;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!lesson) return null;

  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    videoId: lesson.videoId,
    order: lesson.order,
    notes: lesson.notes,
    isPublished: lesson.isPublished,
  };
}

export type GameOverview = {
  id: string;
  title: string;
  description: string;
  levelCount: number;
};

export type GameLevelConfig = {
  id: string;
  gameId: string;
  levelNumber: number;
  configJson: { prompt: string; choices: string[]; answer: string };
};

async function listGamesUncached(): Promise<GameOverview[]> {
  if (!hasDatabase()) {
    return mockGames.map((game) => ({
      id: game.id,
      title: game.title,
      description: game.description,
      levelCount: game.levelCount,
    }));
  }

  const prisma = getPrisma()!;
  const dbGames = await prisma.game.findMany({
    where: { isPublished: true },
    include: {
      levels: { orderBy: { levelNumber: "asc" }, select: { id: true } },
    },
    orderBy: { title: "asc" },
  });
  return dbGames.map((game) => ({
    id: game.id,
    title: game.title,
    description: game.description,
    levelCount: game.levels.length,
  }));
}

async function getGameUncached(gameId: string) {
  if (!hasDatabase()) {
    return getMockGame(gameId) ?? null;
  }

  const prisma = getPrisma()!;
  return prisma.game.findFirst({
    where: { id: gameId },
  });
}

async function getGameWithLevelsUncached(
  gameId: string,
): Promise<{ game: { id: string; title: string; description: string }; levels: GameLevelConfig[] } | null> {
  if (!hasDatabase()) {
    const game = getMockGame(gameId);
    const levels = getMockGameLevels(gameId);
    if (!game) return null;
    return {
      game: { id: game.id, title: game.title, description: game.description },
      levels: levels.map((l) => ({
        id: l.id,
        gameId: l.gameId,
        levelNumber: l.levelNumber,
        configJson: l.configJson,
      })),
    };
  }

  const prisma = getPrisma()!;
  const game = await prisma.game.findFirst({
    where: { id: gameId },
    include: {
      levels: { orderBy: { levelNumber: "asc" } },
    },
  });
  if (!game) return null;

  const levels: GameLevelConfig[] = game.levels.map((level) => {
    const config = level.configJson as { prompt?: string; choices?: string[]; answer?: string };
    return {
      id: level.id,
      gameId: level.gameId,
      levelNumber: level.levelNumber,
      configJson: {
        prompt: config?.prompt ?? "Choose the correct answer.",
        choices: Array.isArray(config?.choices) ? config.choices : [],
        answer: config?.answer ?? "",
      },
    };
  });

  return {
    game: { id: game.id, title: game.title, description: game.description },
    levels,
  };
}

export const listCourses = cache(listCoursesUncached);
export const getCourse = cache(getCourseUncached);
export const getLesson = cache(getLessonUncached);
export const listLessons = cache(listLessonsUncached);
export const listGames = cache(listGamesUncached);
export const getGame = cache(getGameUncached);
export const getGameWithLevels = cache(getGameWithLevelsUncached);

export type ContinueWatchingItem = {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
  watchPercent: number;
  href: string;
};

export type DashboardStats = {
  continueWatching: ContinueWatchingItem | null;
  completedTotal: number;
  completedThisWeek: number;
  streakDays: number;
};

async function getDashboardStatsUncached(
  userId: string,
): Promise<DashboardStats> {
  if (process.env.DEBUG_CACHE === "1") {
    console.log(`[cache-miss] getDashboardStats user=${userId}`);
  }
  if (!hasDatabase()) {
    return {
      continueWatching: null,
      completedTotal: 0,
      completedThisWeek: 0,
      streakDays: 0,
    };
  }

  const prisma = getPrisma()!;

  // Continue watching: most recent progress not yet completed (no completedAt or watchPercent < 100)
  const inProgress = await prisma.lessonProgress.findFirst({
    where: {
      userId,
      OR: [
        { completedAt: null },
        { watchPercent: { lt: 100 } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      lesson: { include: { course: true } },
    },
  });

  const continueWatching: ContinueWatchingItem | null = inProgress
    ? {
        lessonId: inProgress.lesson.id,
        courseId: inProgress.lesson.courseId,
        lessonTitle: inProgress.lesson.title,
        courseTitle: inProgress.lesson.course.title,
        watchPercent: inProgress.watchPercent,
        href: `/courses/${inProgress.lesson.courseId}/lessons/${inProgress.lesson.id}`,
      }
    : null;

  // Completed: total and this week (Monday–today)
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const counts = await prisma.$queryRaw<{ total: bigint; week: bigint }[]>`
    SELECT
      COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL) AS total,
      COUNT(*) FILTER (WHERE "completedAt" >= ${startOfWeek}) AS week
    FROM "LessonProgress"
    WHERE "userId" = ${userId};
  `;

  const completedTotal = Number(counts?.[0]?.total ?? 0);
  const completedThisWeek = Number(counts?.[0]?.week ?? 0);

  if (completedTotal === 0) {
    return {
      continueWatching,
      completedTotal,
      completedThisWeek,
      streakDays: 0,
    };
  }

  const completionDates = await prisma.$queryRaw<{ date: Date }[]>`
    SELECT DISTINCT DATE("completedAt") AS date
    FROM "LessonProgress"
    WHERE "userId" = ${userId}
      AND "completedAt" IS NOT NULL
    ORDER BY date DESC;
  `;

  const sortedDates = completionDates
    .map((row) => row.date.toISOString().slice(0, 10))
    .filter(Boolean);

  let streakDays = 0;
  if (sortedDates.length > 0) {
    const mostRecent = sortedDates[0];
    const check = new Date(mostRecent + "T00:00:00.000Z");
    const completionDateSet = new Set(sortedDates);
    while (completionDateSet.has(check.toISOString().slice(0, 10))) {
      streakDays++;
      check.setUTCDate(check.getUTCDate() - 1);
    }
  }

  return {
    continueWatching,
    completedTotal,
    completedThisWeek,
    streakDays,
  };
}

export const getDashboardStats = (userId: string) =>
  unstable_cache(
    () => getDashboardStatsUncached(userId),
    ["dashboard-stats", userId],
    { revalidate: 60, tags: [`dashboard-stats:${userId}`] },
  )();

export async function listQuizQuestions(
  lessonId: string,
): Promise<QuizQuestionDetail[]> {
  if (!hasDatabase()) {
    const fallbackQuestion =
      lessonId === "lesson-logic-1"
        ? [
            {
              id: "mock-q1",
              lessonId,
              type: "MULTIPLE_CHOICE" as const,
              question: "Which shape completes the pattern?",
              options: ["Triangle", "Square", "Circle"],
              answer: "Square",
              explanation: "The pattern alternates triangle and square.",
            },
          ]
        : [];

    return fallbackQuestion;
  }

  const prisma = getPrisma()!;
  const questions = await prisma.quizQuestion.findMany({
    where: { lessonId },
    orderBy: { createdAt: "asc" },
  });

  return questions.map((question) => ({
    id: question.id,
    lessonId: question.lessonId,
    type: question.type,
    question: question.question,
    options: Array.isArray(question.options)
      ? (question.options as string[])
      : null,
    answer: question.answer,
    explanation: question.explanation ?? null,
  }));
}
