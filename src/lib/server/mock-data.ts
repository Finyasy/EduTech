export type CourseSummary = {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  lessonCount: number;
  difficulty?: string;
  estimatedMinutes?: number;
  imageUrl?: string;
  ageBand?: "5-7" | "8-10" | "11-14";
  pathwayStage?: "Explorer" | "Builder" | "Creator";
  aiFocus?: string;
  codingFocus?: string;
  mathFocus?: string;
  missionOutcome?: string;
  sessionBlueprint?: string;
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
    title: "AI Pattern Detectives",
    description:
      "Kids train simple classifiers by spotting patterns in shapes, sounds, and pictures.",
    gradeLevel: "Ages 5-7",
    lessonCount: 3,
    difficulty: "Explorer",
    estimatedMinutes: 40,
    ageBand: "5-7",
    pathwayStage: "Explorer",
    aiFocus: "Classification basics",
    codingFocus: "Sequencing and condition blocks",
    mathFocus: "Patterns and counting",
    missionOutcome: "Train a sorting robot to classify objects.",
    sessionBlueprint: "10 min learn, 20 min build, 5 min share",
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-math",
    title: "Robot Coders Math Lab",
    description:
      "Learners use loops and variables to control robots while testing coordinates and probability.",
    gradeLevel: "Ages 8-10",
    lessonCount: 3,
    difficulty: "Builder",
    estimatedMinutes: 45,
    ageBand: "8-10",
    pathwayStage: "Builder",
    aiFocus: "Rule-based decision systems",
    codingFocus: "Loops, variables, and debugging",
    mathFocus: "Coordinates, fractions, and probability",
    missionOutcome: "Build a robot path planner that avoids obstacles.",
    sessionBlueprint: "12 min learn, 20 min build, 8 min reflect",
    imageUrl:
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-story",
    title: "Story Chatbot Studio",
    description:
      "Students design a safe storytelling chatbot and use data tables to improve responses.",
    gradeLevel: "Ages 11-14",
    lessonCount: 3,
    difficulty: "Creator",
    estimatedMinutes: 50,
    ageBand: "11-14",
    pathwayStage: "Creator",
    aiFocus: "Prompt design, bias checks, and model behavior",
    codingFocus: "Python functions and simple data handling",
    mathFocus: "Averages, percentages, and data interpretation",
    missionOutcome: "Create a classroom-safe chatbot for story prompts.",
    sessionBlueprint: "15 min learn, 20 min build, 10 min present",
    imageUrl:
      "https://images.unsplash.com/photo-1523240798132-875721f8a2c3?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-safari",
    title: "Sound Sorting Safari",
    description:
      "Young learners sort animal sounds and picture clues to teach a tiny AI helper how to group ideas.",
    gradeLevel: "Ages 5-7",
    lessonCount: 3,
    difficulty: "Explorer",
    estimatedMinutes: 35,
    ageBand: "5-7",
    pathwayStage: "Explorer",
    aiFocus: "Classification with labels",
    codingFocus: "Sequencing, matching, and simple logic rules",
    mathFocus: "Grouping, comparing, and counting sets",
    missionOutcome: "Build a safari sorter that groups sounds, shapes, and animals.",
    sessionBlueprint: "8 min warm-up, 18 min build, 6 min share",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-treasure",
    title: "Treasure Bot Trail",
    description:
      "Children code a friendly bot to follow map clues while practicing early coordinates, turns, and patterns.",
    gradeLevel: "Ages 5-7",
    lessonCount: 3,
    difficulty: "Explorer",
    estimatedMinutes: 40,
    ageBand: "5-7",
    pathwayStage: "Explorer",
    aiFocus: "Rule-following helpers",
    codingFocus: "Step-by-step commands and debugging",
    mathFocus: "Position words, order, and spatial patterns",
    missionOutcome: "Guide a treasure bot across a classroom map to collect clues.",
    sessionBlueprint: "10 min learn, 20 min map build, 5 min celebrate",
    imageUrl:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-space-signals",
    title: "Space Signal Detectives",
    description:
      "Learners hunt for unusual space signals, code alert rules, and graph what they discover.",
    gradeLevel: "Ages 8-10",
    lessonCount: 3,
    difficulty: "Builder",
    estimatedMinutes: 48,
    ageBand: "8-10",
    pathwayStage: "Builder",
    aiFocus: "Pattern detection and anomaly spotting",
    codingFocus: "Conditionals, loops, and event alerts",
    mathFocus: "Graphs, coordinates, and comparison",
    missionOutcome: "Create a signal scanner that flags unusual space messages.",
    sessionBlueprint: "12 min investigate, 22 min code, 8 min reflect",
    imageUrl:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-eco-sensors",
    title: "Eco Sensor Builders",
    description:
      "Students design eco-monitor tools that read simple data and decide when a garden needs help.",
    gradeLevel: "Ages 8-10",
    lessonCount: 3,
    difficulty: "Builder",
    estimatedMinutes: 50,
    ageBand: "8-10",
    pathwayStage: "Builder",
    aiFocus: "Thresholds and simple decision rules",
    codingFocus: "Variables, inputs, and debugging",
    mathFocus: "Measurement, comparison, and data tables",
    missionOutcome: "Build a garden monitor that recommends watering or shade.",
    sessionBlueprint: "10 min explore, 25 min build, 8 min test",
    imageUrl:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-climate-data",
    title: "Climate Data Code Studio",
    description:
      "Students analyze climate trends with Python, compare regions, and explain what the numbers mean.",
    gradeLevel: "Ages 11-14",
    lessonCount: 3,
    difficulty: "Creator",
    estimatedMinutes: 55,
    ageBand: "11-14",
    pathwayStage: "Creator",
    aiFocus: "Data patterns, model limits, and prediction caution",
    codingFocus: "Python lists, loops, and chart-ready summaries",
    mathFocus: "Percent change, averages, and trend interpretation",
    missionOutcome: "Build a climate trend report with clear charts and evidence notes.",
    sessionBlueprint: "15 min analyze, 25 min code, 10 min present",
    imageUrl:
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "course-vision-lab",
    title: "Vision Lab Ethics Arcade",
    description:
      "Learners explore image-recognition ideas, test fairness cases, and improve rules in an arcade-style challenge.",
    gradeLevel: "Ages 11-14",
    lessonCount: 3,
    difficulty: "Creator",
    estimatedMinutes: 55,
    ageBand: "11-14",
    pathwayStage: "Creator",
    aiFocus: "Computer vision basics, bias checks, and evaluation",
    codingFocus: "Python conditionals, scoring logic, and test cases",
    mathFocus: "Ratios, percentages, and confusion-count comparisons",
    missionOutcome: "Create a fairer image-checker scorecard and explain one improvement.",
    sessionBlueprint: "12 min demo, 28 min build, 10 min review",
    imageUrl:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1600&auto=format&fit=crop",
  },
];

export const lessons: LessonSummary[] = [
  {
    id: "lesson-logic-1",
    courseId: "course-logic",
    title: "Pattern Hunter Warmup",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Use picture cards to find repeating patterns and label them.",
  },
  {
    id: "lesson-logic-2",
    courseId: "course-logic",
    title: "Train the Sorting Robot",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Build simple if-then rules so a robot can sort shapes correctly.",
  },
  {
    id: "lesson-logic-3",
    courseId: "course-logic",
    title: "Share Your Robot Mission",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Test your classifier, explain mistakes, and improve one rule.",
  },
  {
    id: "lesson-math-1",
    courseId: "course-math",
    title: "Coordinates for Robot Moves",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Guide a robot on a grid using x-y coordinates.",
  },
  {
    id: "lesson-math-2",
    courseId: "course-math",
    title: "Loop Lab and Debug Time",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Use loops to repeat moves and fix logic bugs when the robot crashes.",
  },
  {
    id: "lesson-math-3",
    courseId: "course-math",
    title: "Probability Power-Ups",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Test random events and tune your robot to make better choices.",
  },
  {
    id: "lesson-story-1",
    courseId: "course-story",
    title: "Prompt Safety Playground",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Learn safe prompt starters and blocked topics for school chatbots.",
  },
  {
    id: "lesson-story-2",
    courseId: "course-story",
    title: "Python Story Functions",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Create reusable Python functions that generate story ideas.",
  },
  {
    id: "lesson-story-3",
    courseId: "course-story",
    title: "Bias Check and Demo Day",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Review response fairness with class data and present your chatbot.",
  },
  {
    id: "lesson-safari-1",
    courseId: "course-safari",
    title: "Listen, Label, and Group",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Sort sound and picture cards into groups, then name the rule your AI helper should use.",
  },
  {
    id: "lesson-safari-2",
    courseId: "course-safari",
    title: "Code the Safari Sorter",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Build matching rules and a simple sequence so the sorter can place each animal clue correctly.",
  },
  {
    id: "lesson-safari-3",
    courseId: "course-safari",
    title: "Test and Teach Back",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Try tricky examples, fix one mistake, and explain how your sorting rule works.",
  },
  {
    id: "lesson-treasure-1",
    courseId: "course-treasure",
    title: "Map Moves and Clue Paths",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Use arrows, turns, and position words to plan a treasure route on a grid map.",
  },
  {
    id: "lesson-treasure-2",
    courseId: "course-treasure",
    title: "Program the Treasure Bot",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Write command steps, test turns, and debug one wrong move in your bot trail.",
  },
  {
    id: "lesson-treasure-3",
    courseId: "course-treasure",
    title: "Pattern Clues Challenge",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Solve pattern-based clue cards and improve your path so the bot reaches treasure faster.",
  },
  {
    id: "lesson-space-1",
    courseId: "course-space-signals",
    title: "Signal Patterns on a Star Grid",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Plot signal points on a grid and spot what looks normal versus unusual.",
  },
  {
    id: "lesson-space-2",
    courseId: "course-space-signals",
    title: "Alert Rules and Loops",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Build code rules that loop through signal readings and raise an alert for anomalies.",
  },
  {
    id: "lesson-space-3",
    courseId: "course-space-signals",
    title: "Mission Control Report",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Summarize which signals were flagged and explain the math evidence behind your decision.",
  },
  {
    id: "lesson-eco-1",
    courseId: "course-eco-sensors",
    title: "Measure the Garden",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Collect simple temperature and moisture readings and compare them in a table.",
  },
  {
    id: "lesson-eco-2",
    courseId: "course-eco-sensors",
    title: "Code Sensor Decisions",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Use variables and if-then rules to decide when the garden needs water or shade.",
  },
  {
    id: "lesson-eco-3",
    courseId: "course-eco-sensors",
    title: "Test, Tweak, and Save the Plants",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Run test cases, debug one threshold, and explain how your eco helper makes choices.",
  },
  {
    id: "lesson-climate-1",
    courseId: "course-climate-data",
    title: "Read the Climate Table",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Inspect regional temperature data, calculate averages, and spot trend questions worth testing.",
  },
  {
    id: "lesson-climate-2",
    courseId: "course-climate-data",
    title: "Python Trend Builder",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Write Python loops to summarize climate values and compute percent change over time.",
  },
  {
    id: "lesson-climate-3",
    courseId: "course-climate-data",
    title: "Evidence Report and Model Limits",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Present one trend chart, explain the math, and note one reason predictions can be uncertain.",
  },
  {
    id: "lesson-vision-1",
    courseId: "course-vision-lab",
    title: "How Vision Models See",
    videoId: "M7lc1UVf-VE",
    order: 1,
    notes: "Explore how image features become labels and discuss where recognition can fail.",
  },
  {
    id: "lesson-vision-2",
    courseId: "course-vision-lab",
    title: "Scoring Rules and Test Cases",
    videoId: "ysz5S6PUM-U",
    order: 2,
    notes: "Code a scoring script with conditionals and test it on balanced and tricky examples.",
  },
  {
    id: "lesson-vision-3",
    courseId: "course-vision-lab",
    title: "Fairness Fix Arcade",
    videoId: "aqz-KE-bpKQ",
    order: 3,
    notes: "Compare result ratios, identify bias risk, and propose one fairer rule change.",
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
