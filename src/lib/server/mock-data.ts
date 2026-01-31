export type CourseSummary = {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  lessonCount: number;
  difficulty?: string;
  estimatedMinutes?: number;
  imageUrl?: string;
};

export type LessonSummary = {
  id: string;
  courseId: string;
  title: string;
  videoId: string;
  order: number;
  notes: string;
};

export const courses: CourseSummary[] = [
  {
    id: "course-logic",
    title: "Logic Explorers",
    description: "Patterns, sequences, and critical thinking challenges.",
    gradeLevel: "Grades 3-5",
    lessonCount: 3,
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-math",
    title: "Math Adventures",
    description: "Numbers, fractions, and problem-solving quests.",
    gradeLevel: "Grades 4-6",
    lessonCount: 3,
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1600&auto=format&fit=crop",
  },
];

export const lessons: LessonSummary[] = [
  {
    id: "lesson-logic-1",
    courseId: "course-logic",
    title: "Spot the Pattern",
    videoId: "mC6Y9xq-0RA",
    order: 1,
    notes: "Find the next item in a pattern and explain your reasoning.",
  },
  {
    id: "lesson-logic-2",
    courseId: "course-logic",
    title: "Logic Grids",
    videoId: "8qjV4yjiBrg",
    order: 2,
    notes: "Solve puzzles using clues and elimination.",
  },
  {
    id: "lesson-logic-3",
    courseId: "course-logic",
    title: "If-Then Thinking",
    videoId: "hEV6G2-15R4",
    order: 3,
    notes: "Use if-then statements to solve simple mysteries.",
  },
  {
    id: "lesson-math-1",
    courseId: "course-math",
    title: "Fractions in the Wild",
    videoId: "4lkds9NL2qg",
    order: 1,
    notes: "Fractions show up in cooking, building, and sports.",
  },
  {
    id: "lesson-math-2",
    courseId: "course-math",
    title: "Multiplication Tricks",
    videoId: "t2D1dGyG2A0",
    order: 2,
    notes: "Practice quick tricks to multiply numbers faster.",
  },
  {
    id: "lesson-math-3",
    courseId: "course-math",
    title: "Solve the Word Problem",
    videoId: "nV0qKMh8Yx4",
    order: 3,
    notes: "Break down word problems into simple steps.",
  },
];

export const getCourseLessons = (courseId: string) =>
  lessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order);

export const getLesson = (lessonId: string) =>
  lessons.find((lesson) => lesson.id === lessonId);

export const getCourse = (courseId: string) =>
  courses.find((course) => course.id === courseId);

export type GameSummary = {
  id: string;
  title: string;
  description: string;
  levelCount: number;
};

export type GameLevelSummary = {
  id: string;
  gameId: string;
  levelNumber: number;
  configJson: { prompt: string; choices: string[]; answer: string };
};

export const games: GameSummary[] = [
  {
    id: "game-logic-quest",
    title: "Logic Quest",
    description: "Solve the pattern to unlock the next level.",
    levelCount: 3,
  },
];

export const gameLevels: GameLevelSummary[] = [
  {
    id: "level-logic-1",
    gameId: "game-logic-quest",
    levelNumber: 1,
    configJson: {
      prompt: "Choose the next shape in the pattern: △ □ △ ?",
      choices: ["Triangle", "Square", "Circle"],
      answer: "Square",
    },
  },
  {
    id: "level-logic-2",
    gameId: "game-logic-quest",
    levelNumber: 2,
    configJson: {
      prompt: "Which shape does NOT belong? ○ △ ○ □ ○",
      choices: ["Circle", "Triangle", "Square"],
      answer: "Square",
    },
  },
  {
    id: "level-logic-3",
    gameId: "game-logic-quest",
    levelNumber: 3,
    configJson: {
      prompt: "Complete the pattern: □ △ △ □ △ △ ?",
      choices: ["Square", "Triangle", "Circle"],
      answer: "Square",
    },
  },
];

export const getGameLevels = (gameId: string) =>
  gameLevels
    .filter((level) => level.gameId === gameId)
    .sort((a, b) => a.levelNumber - b.levelNumber);

export const getGame = (gameId: string) =>
  games.find((game) => game.id === gameId);
