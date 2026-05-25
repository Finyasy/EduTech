import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  clearScopeDegraded,
  isScopeDegraded,
  markScopeDegraded,
} from "@/lib/server/degraded-mode";
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
  isFallbackData?: boolean;
  ageBand?: "5-7" | "8-10" | "11-14";
  pathwayStage?: "Explorer" | "Builder" | "Creator";
  aiFocus?: string;
  codingFocus?: string;
  mathFocus?: string;
  missionOutcome?: string;
  sessionBlueprint?: string;
};

export type LessonDetail = {
  id: string;
  courseId: string;
  title: string;
  videoId: string;
  order: number;
  notes: string;
  isFallbackData?: boolean;
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

const isDevelopment = process.env.NODE_ENV === "development";

const PUBLIC_DATA_REVALIDATE_SECONDS = 120;
const PUBLIC_DATA_CACHE_VERSION = "2026-03-10-live";
const COURSE_QUERY_TIMEOUT_MS = isDevelopment ? 5_000 : 2_500;
const TEACHER_COURSE_QUERY_TIMEOUT_MS = isDevelopment ? 2_500 : 900;
const GAME_QUERY_TIMEOUT_MS = isDevelopment ? 3_500 : 2_200;
const SHARED_DATA_QUERY_TIMEOUT_MS = isDevelopment ? 4_500 : 2_500;
const COURSES_DEGRADED_SCOPE = "courses-public";
const GAMES_DEGRADED_SCOPE = "games-public";
const DASHBOARD_DEGRADED_SCOPE = "dashboard-stats";
const withUnstableCache = <Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  options: { revalidate: number; tags?: string[] },
) => (process.env.NODE_ENV === "test" ? fn : unstable_cache(fn, keyParts, options));

const degradedModeEnabled = () => process.env.NODE_ENV !== "test";

const isDegraded = (scope: string) =>
  degradedModeEnabled() && isScopeDegraded(scope);

const markDegraded = (scope: string, error: unknown) => {
  if (!degradedModeEnabled()) return;
  markScopeDegraded(
    scope,
    error instanceof Error ? error.message : String(error ?? "db-degraded"),
  );
};

const clearDegraded = (scope: string) => {
  if (!degradedModeEnabled()) return;
  clearScopeDegraded(scope);
};

const parseAgeBand = (
  value: string | null,
): CourseOverview["ageBand"] => {
  if (value === "5-7" || value === "8-10" || value === "11-14") {
    return value;
  }
  return undefined;
};

const parsePathwayStage = (
  value: string | null,
): CourseOverview["pathwayStage"] => {
  if (value === "Explorer" || value === "Builder" || value === "Creator") {
    return value;
  }
  return undefined;
};

const isCourseMetadataUnavailableError = (error: unknown) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return error.message.includes("Unknown field `ageBand`");
  }

  return false;
};

export const getFallbackCourseOverviews = (): CourseOverview[] =>
  mockCourses.map((course) => {
    const courseLessons = getMockCourseLessons(course.id);
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      gradeLevel: course.gradeLevel,
      lessonCount: courseLessons.length,
      firstLessonId: courseLessons[0]?.id ?? null,
      isFallbackData: true,
      ageBand: course.ageBand,
      pathwayStage: course.pathwayStage,
      aiFocus: course.aiFocus,
      codingFocus: course.codingFocus,
      mathFocus: course.mathFocus,
      missionOutcome: course.missionOutcome,
      sessionBlueprint: course.sessionBlueprint,
    };
  });

const getMockCourseByIdWithFallbackFlag = (courseId: string) => {
  const course = getMockCourse(courseId);
  return course ? { ...course, isFallbackData: true } : null;
};

const getMockLessonByIdWithFallbackFlag = (lessonId: string): LessonDetail | null => {
  const lesson = getMockLesson(lessonId);
  return lesson ? { ...lesson, isFallbackData: true } : null;
};

const getMockCourseLessonsWithFallbackFlag = (courseId: string): LessonDetail[] =>
  getMockCourseLessons(courseId).map((lesson) => ({
    ...lesson,
    isFallbackData: true,
  }));

const withCourseQueryTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs = COURSE_QUERY_TIMEOUT_MS,
): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs),
    ),
  ]);

const withSharedDataQueryTimeout = async <T,>(
  promise: Promise<T>,
  label: string,
  timeoutMs = SHARED_DATA_QUERY_TIMEOUT_MS,
): Promise<T> => {
  const result = await Promise.race([
    promise.then((value) => ({ ok: true as const, value })),
    new Promise<{ ok: false }>((resolve) =>
      setTimeout(() => resolve({ ok: false }), timeoutMs),
    ),
  ]);

  if (!result.ok) {
    throw new Error(`${label}-query-timeout`);
  }

  return result.value;
};

async function listCoursesFromDatabaseWithTimeout(
  timeoutMs: number,
): Promise<CourseOverview[]> {
  const prisma = getPrisma()!;
  try {
    const dbCourses = await withCourseQueryTimeout(
      prisma.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          ageBand: true,
          pathwayStage: true,
          aiFocus: true,
          codingFocus: true,
          mathFocus: true,
          missionOutcome: true,
          sessionBlueprint: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            select: { id: true },
          },
        },
        orderBy: { title: "asc" },
      }),
      timeoutMs,
    );
    if (!dbCourses) {
      throw new Error("courses-query-timeout");
    }
    return dbCourses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      gradeLevel: course.gradeLevel,
      lessonCount: course.lessons.length,
      firstLessonId: course.lessons[0]?.id ?? null,
      ageBand: parseAgeBand(course.ageBand),
      pathwayStage: parsePathwayStage(course.pathwayStage),
      aiFocus: course.aiFocus ?? undefined,
      codingFocus: course.codingFocus ?? undefined,
      mathFocus: course.mathFocus ?? undefined,
      missionOutcome: course.missionOutcome ?? undefined,
      sessionBlueprint: course.sessionBlueprint ?? undefined,
    }));
  } catch (error) {
    if (!isCourseMetadataUnavailableError(error)) {
      throw error;
    }

    const legacyCourses = await withCourseQueryTimeout(
      prisma.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            select: { id: true },
          },
        },
        orderBy: { title: "asc" },
      }),
      timeoutMs,
    );
    if (!legacyCourses) {
      throw new Error("courses-legacy-query-timeout");
    }
    return legacyCourses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      gradeLevel: course.gradeLevel,
      lessonCount: course.lessons.length,
      firstLessonId: course.lessons[0]?.id ?? null,
      ageBand: undefined,
      pathwayStage: undefined,
      aiFocus: undefined,
      codingFocus: undefined,
      mathFocus: undefined,
      missionOutcome: undefined,
      sessionBlueprint: undefined,
    }));
  }
}

async function listCoursesLiveUncached(): Promise<CourseOverview[]> {
  return listCoursesFromDatabaseWithTimeout(COURSE_QUERY_TIMEOUT_MS);
}

export async function listCoursesForTeacherWorkspace(): Promise<CourseOverview[]> {
  if (!hasDatabase()) {
    return getFallbackCourseOverviews();
  }

  try {
    return await listCoursesFromDatabaseWithTimeout(TEACHER_COURSE_QUERY_TIMEOUT_MS);
  } catch {
    return getFallbackCourseOverviews();
  }
}

async function listCoursesUncached(): Promise<CourseOverview[]> {
  if (!hasDatabase()) {
    return getFallbackCourseOverviews();
  }

  try {
    const courses = await listCoursesLiveCached();
    clearDegraded(COURSES_DEGRADED_SCOPE);
    return courses;
  } catch (error) {
    markDegraded(COURSES_DEGRADED_SCOPE, error);
    return getFallbackCourseOverviews();
  }
}

async function getCourseUncached(courseId: string) {
  if (!hasDatabase()) {
    return getMockCourseByIdWithFallbackFlag(courseId);
  }
  if (isDegraded(COURSES_DEGRADED_SCOPE)) {
    return getMockCourseByIdWithFallbackFlag(courseId);
  }

  const prisma = getPrisma()!;
  try {
    const course = await withCourseQueryTimeout(
      prisma.course.findFirst({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          ageBand: true,
          pathwayStage: true,
          aiFocus: true,
          codingFocus: true,
          mathFocus: true,
          missionOutcome: true,
          sessionBlueprint: true,
          isPublished: true,
        },
      }),
    );
    if (!course) {
      return getMockCourseByIdWithFallbackFlag(courseId);
    }
    clearDegraded(COURSES_DEGRADED_SCOPE);
    return course;
  } catch (error) {
    if (!isCourseMetadataUnavailableError(error)) {
      markDegraded(COURSES_DEGRADED_SCOPE, error);
      return getMockCourseByIdWithFallbackFlag(courseId);
    }
    const course = await withCourseQueryTimeout(
      prisma.course.findFirst({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          isPublished: true,
        },
      }),
    );
    if (!course) {
      return getMockCourseByIdWithFallbackFlag(courseId);
    }
    clearDegraded(COURSES_DEGRADED_SCOPE);
    return course;
  }
}

async function getLessonUncached(
  lessonId: string,
): Promise<LessonDetail | null> {
  if (!hasDatabase()) {
    return getMockLessonByIdWithFallbackFlag(lessonId);
  }
  if (isDegraded(COURSES_DEGRADED_SCOPE)) {
    return getMockLessonByIdWithFallbackFlag(lessonId);
  }

  const prisma = getPrisma()!;
  try {
    const lesson = await withCourseQueryTimeout(
      prisma.lesson.findFirst({
        where: { id: lessonId },
      }),
    );
    if (!lesson) {
      return getMockLessonByIdWithFallbackFlag(lessonId);
    }
    clearDegraded(COURSES_DEGRADED_SCOPE);
    return lesson;
  } catch (error) {
    markDegraded(COURSES_DEGRADED_SCOPE, error);
    return getMockLessonByIdWithFallbackFlag(lessonId);
  }
}

async function listLessonsUncached(courseId: string): Promise<LessonDetail[]> {
  if (!hasDatabase()) {
    return getMockCourseLessonsWithFallbackFlag(courseId);
  }
  if (isDegraded(COURSES_DEGRADED_SCOPE)) {
    return getMockCourseLessonsWithFallbackFlag(courseId);
  }

  const prisma = getPrisma()!;
  try {
    const lessons = await withCourseQueryTimeout(
      prisma.lesson.findMany({
        where: { courseId, isPublished: true },
        orderBy: { order: "asc" },
      }),
    );
    if (!lessons) {
      markDegraded(COURSES_DEGRADED_SCOPE, "lessons-query-timeout");
      return getMockCourseLessonsWithFallbackFlag(courseId);
    }
    clearDegraded(COURSES_DEGRADED_SCOPE);
    return lessons;
  } catch (error) {
    markDegraded(COURSES_DEGRADED_SCOPE, error);
    return getMockCourseLessonsWithFallbackFlag(courseId);
  }
}

export type CourseForAdmin = CourseOverview & { isPublished: boolean };
export type LessonForAdmin = LessonDetail & { isPublished: boolean };

export async function listCoursesForAdmin(): Promise<CourseForAdmin[]> {
  if (!hasDatabase()) return [];

  const prisma = getPrisma()!;
  try {
    const dbCourses = await withSharedDataQueryTimeout(
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          ageBand: true,
          pathwayStage: true,
          aiFocus: true,
          codingFocus: true,
          mathFocus: true,
          missionOutcome: true,
          sessionBlueprint: true,
          isPublished: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, isPublished: true },
          },
        },
        orderBy: { title: "asc" },
      }),
      "admin-courses-list",
    );
    return dbCourses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      gradeLevel: course.gradeLevel,
      lessonCount: course.lessons.length,
      firstLessonId: course.lessons[0]?.id ?? null,
      ageBand: parseAgeBand(course.ageBand),
      pathwayStage: parsePathwayStage(course.pathwayStage),
      aiFocus: course.aiFocus ?? undefined,
      codingFocus: course.codingFocus ?? undefined,
      mathFocus: course.mathFocus ?? undefined,
      missionOutcome: course.missionOutcome ?? undefined,
      sessionBlueprint: course.sessionBlueprint ?? undefined,
      isPublished: course.isPublished,
    }));
  } catch (error) {
    if (!isCourseMetadataUnavailableError(error)) {
      throw error;
    }

    const legacyCourses = await withSharedDataQueryTimeout(
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          isPublished: true,
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, isPublished: true },
          },
        },
        orderBy: { title: "asc" },
      }),
      "admin-courses-list-legacy",
    );
    return legacyCourses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      gradeLevel: course.gradeLevel,
      lessonCount: course.lessons.length,
      firstLessonId: course.lessons[0]?.id ?? null,
      ageBand: undefined,
      pathwayStage: undefined,
      aiFocus: undefined,
      codingFocus: undefined,
      mathFocus: undefined,
      missionOutcome: undefined,
      sessionBlueprint: undefined,
      isPublished: course.isPublished,
    }));
  }
}

export async function getCourseForAdmin(
  courseId: string,
): Promise<CourseForAdmin | null> {
  if (!hasDatabase()) return null;

  const prisma = getPrisma()!;
  let course: {
    id: string;
    title: string;
    description: string;
    gradeLevel: string;
    ageBand?: string | null;
    pathwayStage?: string | null;
    aiFocus?: string | null;
    codingFocus?: string | null;
    mathFocus?: string | null;
    missionOutcome?: string | null;
    sessionBlueprint?: string | null;
    isPublished: boolean;
    lessons: { id: string }[];
  } | null = null;

  try {
    course = await withSharedDataQueryTimeout(
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          ageBand: true,
          pathwayStage: true,
          aiFocus: true,
          codingFocus: true,
          mathFocus: true,
          missionOutcome: true,
          sessionBlueprint: true,
          isPublished: true,
          lessons: { select: { id: true } },
        },
      }),
      "admin-course-detail",
    );
  } catch (error) {
    if (!isCourseMetadataUnavailableError(error)) {
      throw error;
    }
    course = await withSharedDataQueryTimeout(
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          gradeLevel: true,
          isPublished: true,
          lessons: { select: { id: true } },
        },
      }),
      "admin-course-detail-legacy",
    );
  }
  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    gradeLevel: course.gradeLevel,
    lessonCount: course.lessons.length,
    firstLessonId: course.lessons[0]?.id ?? null,
    ageBand: parseAgeBand(course.ageBand ?? null),
    pathwayStage: parsePathwayStage(course.pathwayStage ?? null),
    aiFocus: course.aiFocus ?? undefined,
    codingFocus: course.codingFocus ?? undefined,
    mathFocus: course.mathFocus ?? undefined,
    missionOutcome: course.missionOutcome ?? undefined,
    sessionBlueprint: course.sessionBlueprint ?? undefined,
    isPublished: course.isPublished,
  };
}

export async function listLessonsForAdmin(
  courseId: string,
): Promise<LessonForAdmin[]> {
  if (!hasDatabase()) return [];

  const prisma = getPrisma()!;
  const lessons = await withSharedDataQueryTimeout(
    prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    }),
    "admin-lessons-list",
  );
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
  const lesson = await withSharedDataQueryTimeout(
    prisma.lesson.findUnique({
      where: { id: lessonId },
    }),
    "admin-lesson-detail",
  );
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
  isFallbackData?: boolean;
};

export type GameLevelConfig = {
  id: string;
  gameId: string;
  levelNumber: number;
  configJson: { prompt: string; choices: string[]; answer: string };
};

const getMockGameOverviews = (): GameOverview[] =>
  mockGames.map((game) => ({
    id: game.id,
    title: game.title,
    description: game.description,
    levelCount: game.levelCount,
    isFallbackData: true,
  }));

const getMockGameWithLevels = (
  gameId: string,
): { game: { id: string; title: string; description: string }; levels: GameLevelConfig[] } | null => {
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
};

const withGameQueryTimeout = async <T,>(
  promise: Promise<T>,
): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), GAME_QUERY_TIMEOUT_MS),
    ),
  ]);

async function listGamesLiveUncached(): Promise<GameOverview[]> {
  const prisma = getPrisma()!;
  const dbGames = await withGameQueryTimeout(
    prisma.game.findMany({
      where: { isPublished: true },
      include: {
        levels: { orderBy: { levelNumber: "asc" }, select: { id: true } },
      },
      orderBy: { title: "asc" },
    }),
  );
  if (!dbGames) {
    throw new Error("games-query-timeout");
  }
  return dbGames.map((game) => ({
    id: game.id,
    title: game.title,
    description: game.description,
    levelCount: game.levels.length,
  }));
}

async function listGamesUncached(): Promise<GameOverview[]> {
  if (!hasDatabase()) {
    return getMockGameOverviews();
  }

  try {
    const games = await listGamesLiveCached();
    clearDegraded(GAMES_DEGRADED_SCOPE);
    return games;
  } catch (error) {
    markDegraded(GAMES_DEGRADED_SCOPE, error);
    return getMockGameOverviews();
  }
}

async function getGameUncached(gameId: string) {
  if (!hasDatabase()) {
    return getMockGame(gameId) ?? null;
  }

  const prisma = getPrisma()!;
  try {
    const game = await withGameQueryTimeout(
      prisma.game.findFirst({
        where: { id: gameId },
      }),
    );
    if (!game) {
      return getMockGame(gameId) ?? null;
    }
    clearDegraded(GAMES_DEGRADED_SCOPE);
    return game;
  } catch (error) {
    markDegraded(GAMES_DEGRADED_SCOPE, error);
    return getMockGame(gameId) ?? null;
  }
}

async function getGameWithLevelsUncached(
  gameId: string,
): Promise<{ game: { id: string; title: string; description: string }; levels: GameLevelConfig[] } | null> {
  if (!hasDatabase()) {
    return getMockGameWithLevels(gameId);
  }

  const prisma = getPrisma()!;
  try {
    const game = await withGameQueryTimeout(
      prisma.game.findFirst({
        where: { id: gameId },
        include: {
          levels: { orderBy: { levelNumber: "asc" } },
        },
      }),
    );
    if (!game) return getMockGameWithLevels(gameId);

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

    clearDegraded(GAMES_DEGRADED_SCOPE);
    return {
      game: { id: game.id, title: game.title, description: game.description },
      levels,
    };
  } catch (error) {
    markDegraded(GAMES_DEGRADED_SCOPE, error);
    return getMockGameWithLevels(gameId);
  }
}

const listCoursesLiveCached = withUnstableCache(
  listCoursesLiveUncached,
  ["courses-live", PUBLIC_DATA_CACHE_VERSION],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["courses"] },
);
export const listCourses = cache(listCoursesUncached);

export const getCourse = cache((courseId: string) =>
  withUnstableCache(
    () => getCourseUncached(courseId),
    ["course", courseId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ["courses", `course:${courseId}`],
    },
  )(),
);

export const getLesson = cache((lessonId: string) =>
  withUnstableCache(
    () => getLessonUncached(lessonId),
    ["lesson", lessonId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ["lessons", `lesson:${lessonId}`],
    },
  )(),
);

export const listLessons = cache((courseId: string) =>
  withUnstableCache(
    () => listLessonsUncached(courseId),
    ["lessons", courseId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ["lessons", `lessons:${courseId}`, `course:${courseId}`],
    },
  )(),
);

const listGamesLiveCached = withUnstableCache(
  listGamesLiveUncached,
  ["games-live", PUBLIC_DATA_CACHE_VERSION],
  { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["games"] },
);
export const listGames = cache(listGamesUncached);

export const getGame = cache((gameId: string) =>
  withUnstableCache(
    () => getGameUncached(gameId),
    ["game-live", PUBLIC_DATA_CACHE_VERSION, gameId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ["games", `game:${gameId}`],
    },
  )(),
);

export const getGameWithLevels = cache((gameId: string) =>
  withUnstableCache(
    () => getGameWithLevelsUncached(gameId),
    ["game-with-levels-live", PUBLIC_DATA_CACHE_VERSION, gameId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: ["games", `game:${gameId}`],
    },
  )(),
);

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
  mastery: {
    ai: number;
    coding: number;
    math: number;
  };
  isFallbackData?: boolean;
};

export type LearnerArtifactSummary = {
  id: string;
  userId: string;
  learnerName: string | null;
  learnerEmail: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  title: string;
  buildType: string;
  reflection: string;
  artifactUrl: string | null;
  status: "SUBMITTED" | "REVIEWED";
  createdAt: string;
};

export type TeacherLearnerDashboardSummary = {
  learner: {
    id: string;
    classId: string;
    userId: string | null;
    name: string;
    linkedAccount: boolean;
  };
  dashboard: DashboardStats | null;
  quiz: {
    attemptCount: number;
    averageScore: number | null;
    latestScore: number | null;
    latestSubmittedAt: string | null;
  };
  games: {
    attemptCount: number;
    bestRecordCount: number;
    bestScore: number | null;
    latestSubmittedAt: string | null;
  };
  artifacts: {
    totalCount: number;
    reviewedCount: number;
    recent: LearnerArtifactSummary[];
  };
};

const fallbackDashboardStats = (): DashboardStats => ({
  continueWatching: null,
  completedTotal: 0,
  completedThisWeek: 0,
  streakDays: 0,
  mastery: { ai: 0, coding: 0, math: 0 },
  isFallbackData: true,
});

const fallbackMasteryFromActivity = (input: {
  completedTotal: number;
  completedThisWeek: number;
  streakDays: number;
}) => ({
  ai: Math.max(0, Math.min(100, input.completedTotal * 12 + input.completedThisWeek * 8)),
  coding: Math.max(0, Math.min(100, input.completedTotal * 10 + input.streakDays * 5)),
  math: Math.max(0, Math.min(100, input.completedTotal * 9 + input.completedThisWeek * 10)),
});

async function getMasteryPercentages(userId: string) {
  if (!hasDatabase()) {
    return { ai: 0, coding: 0, math: 0 };
  }

  const prisma = getPrisma()!;
  const rows = await withSharedDataQueryTimeout(
    prisma.masteryScore.groupBy({
      by: ["rubricId"],
      where: {
        userId,
        assessedAt: { not: null },
      },
      _avg: { score: true },
    }),
    "dashboard-mastery-rows",
  );

  if (rows.length === 0) {
    return { ai: 0, coding: 0, math: 0 };
  }

  const rubrics = await withSharedDataQueryTimeout(
    prisma.masteryRubric.findMany({
      where: { id: { in: rows.map((row) => row.rubricId) } },
      select: { id: true, dimension: true, maxScore: true },
    }),
    "dashboard-mastery-rubrics",
  );
  const rubricMap = new Map(rubrics.map((rubric) => [rubric.id, rubric]));
  const buckets = {
    AI: [] as number[],
    CODING: [] as number[],
    MATH: [] as number[],
  };

  rows.forEach((row) => {
    const rubric = rubricMap.get(row.rubricId);
    const average = row._avg.score;
    if (!rubric || average === null || rubric.maxScore <= 0) {
      return;
    }
    buckets[rubric.dimension].push(Math.round((average / rubric.maxScore) * 100));
  });

  const averageBucket = (values: number[]) =>
    values.length === 0
      ? 0
      : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  return {
    ai: averageBucket(buckets.AI),
    coding: averageBucket(buckets.CODING),
    math: averageBucket(buckets.MATH),
  };
}

async function getDashboardStatsUncached(
  userId: string,
): Promise<DashboardStats> {
  if (process.env.DEBUG_CACHE === "1") {
    console.log(`[cache-miss] getDashboardStats user=${userId}`);
  }
  if (!hasDatabase()) {
    return fallbackDashboardStats();
  }

  const prisma = getPrisma()!;
  try {
    // Continue watching: most recent progress not yet completed (no completedAt or watchPercent < 100)
    const inProgress = await withSharedDataQueryTimeout(
      prisma.lessonProgress.findFirst({
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
      }),
      "dashboard-continue-watching",
    );

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

    const counts = await withSharedDataQueryTimeout(
      prisma.$queryRaw<{ total: bigint; week: bigint }[]>`
        SELECT
          COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL) AS total,
          COUNT(*) FILTER (WHERE "completedAt" >= ${startOfWeek}) AS week
        FROM "LessonProgress"
        WHERE "userId" = ${userId};
      `,
      "dashboard-completion-counts",
    );

    const completedTotal = Number(counts?.[0]?.total ?? 0);
    const completedThisWeek = Number(counts?.[0]?.week ?? 0);
    let mastery = await getMasteryPercentages(userId);

    if (completedTotal === 0) {
      mastery = mastery.ai || mastery.coding || mastery.math
        ? mastery
        : fallbackMasteryFromActivity({ completedTotal, completedThisWeek, streakDays: 0 });
      clearDegraded(DASHBOARD_DEGRADED_SCOPE);
      return {
        continueWatching,
        completedTotal,
        completedThisWeek,
        streakDays: 0,
        mastery,
      };
    }

    const completionDates = await withSharedDataQueryTimeout(
      prisma.$queryRaw<{ date: Date }[]>`
        SELECT DISTINCT DATE("completedAt") AS date
        FROM "LessonProgress"
        WHERE "userId" = ${userId}
          AND "completedAt" IS NOT NULL
        ORDER BY date DESC;
      `,
      "dashboard-completion-dates",
    );

    const sortedDates = completionDates
      .map((row) => row.date.toISOString().slice(0, 10))
      .filter(Boolean);

    let streakDays = 0;
    if (sortedDates.length > 0) {
      const mostRecent = sortedDates[0];
      const todayKey = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);

      if (mostRecent === todayKey || mostRecent === yesterdayKey) {
        const check = new Date(mostRecent + "T00:00:00.000Z");
        const completionDateSet = new Set(sortedDates);
        while (completionDateSet.has(check.toISOString().slice(0, 10))) {
          streakDays++;
          check.setUTCDate(check.getUTCDate() - 1);
        }
      }
    }

    clearDegraded(DASHBOARD_DEGRADED_SCOPE);
    mastery = mastery.ai || mastery.coding || mastery.math
      ? mastery
      : fallbackMasteryFromActivity({ completedTotal, completedThisWeek, streakDays });
    return {
      continueWatching,
      completedTotal,
      completedThisWeek,
      streakDays,
      mastery,
    };
  } catch (error) {
    markDegraded(DASHBOARD_DEGRADED_SCOPE, error);
    throw error;
  }
}

export const getDashboardStats = (userId: string) =>
  unstable_cache(
    () => getDashboardStatsUncached(userId),
    ["dashboard-stats", PUBLIC_DATA_CACHE_VERSION, userId],
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
  const questions = await withSharedDataQueryTimeout(
    prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { createdAt: "asc" },
    }),
    "quiz-questions",
  );

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

export async function listLearnerArtifactsForLesson(
  userId: string,
  lessonId: string,
): Promise<LearnerArtifactSummary[]> {
  if (!hasDatabase()) {
    return [];
  }

  const prisma = getPrisma()!;
  const artifacts = await withSharedDataQueryTimeout(
    prisma.learnerArtifact.findMany({
      where: { userId, lessonId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    }),
    "learner-artifacts-lesson-list",
  );

  return artifacts.map((artifact) => ({
    id: artifact.id,
    userId: artifact.userId,
    learnerName: artifact.user.name,
    learnerEmail: artifact.user.email,
    lessonId: artifact.lessonId,
    lessonTitle: artifact.lesson.title,
    courseId: artifact.lesson.courseId,
    courseTitle: artifact.lesson.course.title,
    title: artifact.title,
    buildType: artifact.buildType,
    reflection: artifact.reflection,
    artifactUrl: artifact.artifactUrl,
    status: artifact.status,
    createdAt: artifact.createdAt.toISOString(),
  }));
}

export async function listRecentLearnerArtifacts(
  limit = 12,
  options?: { userIds?: string[] },
): Promise<LearnerArtifactSummary[]> {
  if (!hasDatabase()) {
    return [];
  }

  const prisma = getPrisma()!;
  const artifacts = await withSharedDataQueryTimeout(
    prisma.learnerArtifact.findMany({
      where:
        options?.userIds && options.userIds.length > 0
          ? { userId: { in: options.userIds } }
          : undefined,
      take: Math.max(1, Math.min(limit, 50)),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    }),
    "learner-artifacts-recent-list",
  );

  return artifacts.map((artifact) => ({
    id: artifact.id,
    userId: artifact.userId,
    learnerName: artifact.user.name,
    learnerEmail: artifact.user.email,
    lessonId: artifact.lessonId,
    lessonTitle: artifact.lesson.title,
    courseId: artifact.lesson.courseId,
    courseTitle: artifact.lesson.course.title,
    title: artifact.title,
    buildType: artifact.buildType,
    reflection: artifact.reflection,
    artifactUrl: artifact.artifactUrl,
    status: artifact.status,
    createdAt: artifact.createdAt.toISOString(),
  }));
}

export async function listRecentLearnerArtifactsForClass(
  ownerKey: string,
  classId: string,
  limit = 12,
): Promise<LearnerArtifactSummary[]> {
  if (!hasDatabase()) {
    return [];
  }

  const prisma = getPrisma()!;
  const learners = await withSharedDataQueryTimeout(
    prisma.teacherLearner.findMany({
      where: {
        classId,
        classroom: { ownerKey, isArchived: false },
        userId: { not: null },
      },
      select: { userId: true },
    }),
    "teacher-class-artifact-learners",
  );
  const userIds = learners
    .map((learner) => learner.userId)
    .filter((userId): userId is string => Boolean(userId));

  if (userIds.length === 0) {
    return [];
  }

  return listRecentLearnerArtifacts(limit, { userIds });
}

export async function getTeacherLearnerDashboardSummary(input: {
  ownerKey: string;
  classId: string;
  learnerId: string;
}): Promise<TeacherLearnerDashboardSummary | null> {
  if (!hasDatabase()) {
    return null;
  }

  const prisma = getPrisma()!;
  const learner = await withSharedDataQueryTimeout(
    prisma.teacherLearner.findFirst({
      where: {
        id: input.learnerId,
        classId: input.classId,
        classroom: { ownerKey: input.ownerKey, isArchived: false },
      },
      select: {
        id: true,
        classId: true,
        userId: true,
        name: true,
      },
    }),
    "teacher-learner-summary-link",
  );

  if (!learner) {
    return null;
  }

  if (!learner.userId) {
    return {
      learner: {
        id: learner.id,
        classId: learner.classId,
        userId: null,
        name: learner.name,
        linkedAccount: false,
      },
      dashboard: null,
      quiz: {
        attemptCount: 0,
        averageScore: null,
        latestScore: null,
        latestSubmittedAt: null,
      },
      games: {
        attemptCount: 0,
        bestRecordCount: 0,
        bestScore: null,
        latestSubmittedAt: null,
      },
      artifacts: {
        totalCount: 0,
        reviewedCount: 0,
        recent: [],
      },
    };
  }

  const userId = learner.userId;
  const [
    dashboard,
    quizAggregate,
    latestQuizAttempt,
    gameAttemptCount,
    latestGameAttempt,
    gameBestAggregate,
    artifactTotalCount,
    artifactReviewedCount,
    recentArtifacts,
  ] = await Promise.all([
    withSharedDataQueryTimeout(
      getDashboardStats(userId),
      "teacher-learner-summary-dashboard",
    ),
    withSharedDataQueryTimeout(
      prisma.quizAttempt.aggregate({
        where: { userId },
        _count: { _all: true },
        _avg: { score: true },
      }),
      "teacher-learner-summary-quiz-aggregate",
    ),
    withSharedDataQueryTimeout(
      prisma.quizAttempt.findFirst({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        select: { score: true, submittedAt: true },
      }),
      "teacher-learner-summary-quiz-latest",
    ),
    withSharedDataQueryTimeout(
      prisma.gameAttempt.count({
        where: { userId },
      }),
      "teacher-learner-summary-game-attempt-count",
    ),
    withSharedDataQueryTimeout(
      prisma.gameAttempt.findFirst({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        select: { submittedAt: true },
      }),
      "teacher-learner-summary-game-latest",
    ),
    withSharedDataQueryTimeout(
      prisma.gameBest.aggregate({
        where: { userId },
        _count: { _all: true },
        _max: { bestScore: true },
      }),
      "teacher-learner-summary-game-best-aggregate",
    ),
    withSharedDataQueryTimeout(
      prisma.learnerArtifact.count({
        where: { userId },
      }),
      "teacher-learner-summary-artifact-total",
    ),
    withSharedDataQueryTimeout(
      prisma.learnerArtifact.count({
        where: { userId, status: "REVIEWED" },
      }),
      "teacher-learner-summary-artifact-reviewed",
    ),
    listRecentLearnerArtifacts(5, { userIds: [userId] }),
  ]);

  return {
    learner: {
      id: learner.id,
      classId: learner.classId,
      userId,
      name: learner.name,
      linkedAccount: true,
    },
    dashboard,
    quiz: {
      attemptCount: quizAggregate._count._all,
      averageScore:
        typeof quizAggregate._avg.score === "number"
          ? Math.round(quizAggregate._avg.score * 100) / 100
          : null,
      latestScore: latestQuizAttempt?.score ?? null,
      latestSubmittedAt: latestQuizAttempt?.submittedAt.toISOString() ?? null,
    },
    games: {
      attemptCount: gameAttemptCount,
      bestRecordCount: gameBestAggregate._count._all,
      bestScore: gameBestAggregate._max.bestScore ?? null,
      latestSubmittedAt: latestGameAttempt?.submittedAt.toISOString() ?? null,
    },
    artifacts: {
      totalCount: artifactTotalCount,
      reviewedCount: artifactReviewedCount,
      recent: recentArtifacts,
    },
  };
}
