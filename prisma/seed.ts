import {
  Prisma,
  PrismaClient,
  QuestionType,
  TeacherSessionLearnerStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionCandidates = [
  process.env.MIGRATE_DATABASE_URL ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL,
  process.env.DIRECT_URL,
  process.env.DATABASE_URL,
]
  .filter((value): value is string => Boolean(value))
  .filter((value, index, all) => all.indexOf(value) === index);

if (connectionCandidates.length === 0) {
  throw new Error(
    "MIGRATE_DATABASE_URL, DIRECT_URL, or DATABASE_URL is required to run the seed script.",
  );
}

const hostFromConnectionString = (connectionString: string) => {
  const match = connectionString.match(/@([^/?]+)/);
  return match?.[1] ?? "unknown-host";
};

const isConnectivityError = (error: unknown) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1000" || error.code === "P1001")
  ) {
    return true;
  }

  if (error && typeof error === "object") {
    const code = (error as { code?: string }).code;
    return code === "P1000" || code === "P1001";
  }

  return false;
};

async function seedDatabase(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { id: "course-logic" },
    update: {
      title: "AI Pattern Detectives",
      description:
        "Kids train simple classifiers by spotting patterns in shapes, sounds, and pictures.",
      gradeLevel: "Ages 5-7",
      ageBand: "5-7",
      pathwayStage: "Explorer",
      aiFocus: "Classification basics",
      codingFocus: "Sequencing and condition blocks",
      mathFocus: "Patterns and counting",
      missionOutcome: "Train a sorting robot to classify objects.",
      sessionBlueprint: "10 min learn, 20 min build, 5 min share",
      isPublished: true,
    },
    create: {
      id: "course-logic",
      title: "AI Pattern Detectives",
      description:
        "Kids train simple classifiers by spotting patterns in shapes, sounds, and pictures.",
      gradeLevel: "Ages 5-7",
      ageBand: "5-7",
      pathwayStage: "Explorer",
      aiFocus: "Classification basics",
      codingFocus: "Sequencing and condition blocks",
      mathFocus: "Patterns and counting",
      missionOutcome: "Train a sorting robot to classify objects.",
      sessionBlueprint: "10 min learn, 20 min build, 5 min share",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-logic-1",
            title: "Pattern Hunter Warmup",
            videoId: "M7lc1UVf-VE",
            order: 1,
            notes: "Use picture cards to find repeating patterns and label them.",
            isPublished: true,
            questions: {
              create: [
                {
                  type: QuestionType.MULTIPLE_CHOICE,
                  question: "Which shape completes the pattern?",
                  options: ["Triangle", "Square", "Circle"],
                  answer: "Square",
                  explanation: "The pattern alternates triangle and square.",
                },
              ],
            },
          },
          {
            id: "lesson-logic-2",
            title: "Train the Sorting Robot",
            videoId: "ysz5S6PUM-U",
            order: 2,
            notes: "Build simple if-then rules so a robot can sort shapes correctly.",
            isPublished: true,
          },
          {
            id: "lesson-logic-3",
            title: "Share Your Robot Mission",
            videoId: "aqz-KE-bpKQ",
            order: 3,
            notes: "Test your classifier, explain mistakes, and improve one rule.",
            isPublished: true,
          },
        ],
      },
    },
  });

  await prisma.game.upsert({
    where: { id: "game-logic-quest" },
    update: {},
    create: {
      id: "game-logic-quest",
      title: "Logic Quest",
      description: "Solve the pattern to unlock the next level.",
      isPublished: true,
      levels: {
        create: [
          {
            levelNumber: 1,
            configJson: {
              prompt: "Choose the next shape in the pattern: △ □ △ ?",
              choices: ["Triangle", "Square", "Circle"],
              answer: "Square",
            },
          },
          {
            levelNumber: 2,
            configJson: {
              prompt: "Which shape does NOT belong? ○ △ ○ □ ○",
              choices: ["Circle", "Triangle", "Square"],
              answer: "Square",
            },
          },
          {
            levelNumber: 3,
            configJson: {
              prompt: "Complete the pattern: □ △ △ □ △ △ ?",
              choices: ["Square", "Triangle", "Circle"],
              answer: "Square",
            },
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { id: "course-math" },
    update: {
      title: "Robot Coders Math Lab",
      description:
        "Learners use loops and variables to control robots while testing coordinates and probability.",
      gradeLevel: "Ages 8-10",
      ageBand: "8-10",
      pathwayStage: "Builder",
      aiFocus: "Rule-based decision systems",
      codingFocus: "Loops, variables, and debugging",
      mathFocus: "Coordinates, fractions, and probability",
      missionOutcome: "Build a robot path planner that avoids obstacles.",
      sessionBlueprint: "12 min learn, 20 min build, 8 min reflect",
      isPublished: true,
    },
    create: {
      id: "course-math",
      title: "Robot Coders Math Lab",
      description:
        "Learners use loops and variables to control robots while testing coordinates and probability.",
      gradeLevel: "Ages 8-10",
      ageBand: "8-10",
      pathwayStage: "Builder",
      aiFocus: "Rule-based decision systems",
      codingFocus: "Loops, variables, and debugging",
      mathFocus: "Coordinates, fractions, and probability",
      missionOutcome: "Build a robot path planner that avoids obstacles.",
      sessionBlueprint: "12 min learn, 20 min build, 8 min reflect",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-math-1",
            title: "Coordinates for Robot Moves",
            videoId: "M7lc1UVf-VE",
            order: 1,
            notes: "Guide a robot on a grid using x-y coordinates.",
            isPublished: true,
          },
          {
            id: "lesson-math-2",
            title: "Loop Lab and Debug Time",
            videoId: "ysz5S6PUM-U",
            order: 2,
            notes: "Use loops to repeat moves and fix logic bugs when the robot crashes.",
            isPublished: true,
          },
          {
            id: "lesson-math-3",
            title: "Probability Power-Ups",
            videoId: "aqz-KE-bpKQ",
            order: 3,
            notes: "Test random events and tune your robot to make better choices.",
            isPublished: true,
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { id: "course-story" },
    update: {
      title: "Story Chatbot Studio",
      description:
        "Students design a safe storytelling chatbot and use data tables to improve responses.",
      gradeLevel: "Ages 11-14",
      ageBand: "11-14",
      pathwayStage: "Creator",
      aiFocus: "Prompt design, bias checks, and model behavior",
      codingFocus: "Python functions and simple data handling",
      mathFocus: "Averages, percentages, and data interpretation",
      missionOutcome: "Create a classroom-safe chatbot for story prompts.",
      sessionBlueprint: "15 min learn, 20 min build, 10 min present",
      isPublished: true,
    },
    create: {
      id: "course-story",
      title: "Story Chatbot Studio",
      description:
        "Students design a safe storytelling chatbot and use data tables to improve responses.",
      gradeLevel: "Ages 11-14",
      ageBand: "11-14",
      pathwayStage: "Creator",
      aiFocus: "Prompt design, bias checks, and model behavior",
      codingFocus: "Python functions and simple data handling",
      mathFocus: "Averages, percentages, and data interpretation",
      missionOutcome: "Create a classroom-safe chatbot for story prompts.",
      sessionBlueprint: "15 min learn, 20 min build, 10 min present",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-story-1",
            title: "Prompt Safety Playground",
            videoId: "M7lc1UVf-VE",
            order: 1,
            notes: "Learn safe prompt starters and blocked topics for school chatbots.",
            isPublished: true,
          },
          {
            id: "lesson-story-2",
            title: "Python Story Functions",
            videoId: "ysz5S6PUM-U",
            order: 2,
            notes: "Create reusable Python functions that generate story ideas.",
            isPublished: true,
          },
          {
            id: "lesson-story-3",
            title: "Bias Check and Demo Day",
            videoId: "aqz-KE-bpKQ",
            order: 3,
            notes: "Review response fairness with class data and present your chatbot.",
            isPublished: true,
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { id: "course-color-lab" },
    update: {
      title: "Color Quest AI Lab",
      description:
        "Children train a color-and-shape helper, count results, and explain why each item belongs in a group.",
      gradeLevel: "Ages 5-7",
      ageBand: "5-7",
      pathwayStage: "Explorer",
      aiFocus: "Labeling and confidence checks",
      codingFocus: "Block conditions and sequence loops",
      mathFocus: "Counting, comparing sets, and picture graphs",
      missionOutcome: "Create a classroom color sorter and explain one correction.",
      sessionBlueprint: "8 min discover, 20 min build, 5 min share",
      isPublished: true,
    },
    create: {
      id: "course-color-lab",
      title: "Color Quest AI Lab",
      description:
        "Children train a color-and-shape helper, count results, and explain why each item belongs in a group.",
      gradeLevel: "Ages 5-7",
      ageBand: "5-7",
      pathwayStage: "Explorer",
      aiFocus: "Labeling and confidence checks",
      codingFocus: "Block conditions and sequence loops",
      mathFocus: "Counting, comparing sets, and picture graphs",
      missionOutcome: "Create a classroom color sorter and explain one correction.",
      sessionBlueprint: "8 min discover, 20 min build, 5 min share",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-color-1",
            title: "Label the Color Clues",
            videoId: "M7lc1UVf-VE",
            order: 1,
            notes: "Sort colorful shape cards, add labels, and predict how your AI helper should group them.",
            isPublished: true,
          },
          {
            id: "lesson-color-2",
            title: "Code the Color Sorter",
            videoId: "ysz5S6PUM-U",
            order: 2,
            notes: "Build block rules that route each item by color and shape, then debug one wrong decision.",
            isPublished: true,
          },
          {
            id: "lesson-color-3",
            title: "Confidence Meter Showcase",
            videoId: "aqz-KE-bpKQ",
            order: 3,
            notes: "Count correct guesses, draw a mini graph, and explain how one rule change improved results.",
            isPublished: true,
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { id: "course-arcade-ai" },
    update: {
      title: "Arcade AI Game Lab",
      description:
        "Learners code mini-games with adaptive opponents, then tune difficulty using score data.",
      gradeLevel: "Ages 8-10",
      ageBand: "8-10",
      pathwayStage: "Builder",
      aiFocus: "Rule-based game agents and feedback loops",
      codingFocus: "Loops, functions, and game state debugging",
      mathFocus: "Coordinates, rates, and probability tuning",
      missionOutcome: "Ship a playable arcade challenge with fair difficulty.",
      sessionBlueprint: "12 min model, 26 min code, 8 min test",
      isPublished: true,
    },
    create: {
      id: "course-arcade-ai",
      title: "Arcade AI Game Lab",
      description:
        "Learners code mini-games with adaptive opponents, then tune difficulty using score data.",
      gradeLevel: "Ages 8-10",
      ageBand: "8-10",
      pathwayStage: "Builder",
      aiFocus: "Rule-based game agents and feedback loops",
      codingFocus: "Loops, functions, and game state debugging",
      mathFocus: "Coordinates, rates, and probability tuning",
      missionOutcome: "Ship a playable arcade challenge with fair difficulty.",
      sessionBlueprint: "12 min model, 26 min code, 8 min test",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-arcade-1",
            title: "Read Game Signals",
            videoId: "M7lc1UVf-VE",
            order: 1,
            notes: "Track player score and movement patterns to decide when your game AI should react.",
            isPublished: true,
          },
          {
            id: "lesson-arcade-2",
            title: "Code a Smart Opponent",
            videoId: "ysz5S6PUM-U",
            order: 2,
            notes: "Use loops and conditions to build an opponent that adapts to player behavior.",
            isPublished: true,
          },
          {
            id: "lesson-arcade-3",
            title: "Balance and Fairness Tuning",
            videoId: "aqz-KE-bpKQ",
            order: 3,
            notes: "Tune difficulty with probability math and test whether beginner and advanced players both have a fair chance.",
            isPublished: true,
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { id: "course-app-inventor" },
    update: {
      title: "AI App Inventor Studio",
      description:
        "Teens design mobile AI helpers, evaluate model accuracy, and present ethical product decisions.",
      gradeLevel: "Ages 11-14",
      ageBand: "11-14",
      pathwayStage: "Creator",
      aiFocus: "Model training, evaluation, and bias mitigation",
      codingFocus: "Event-driven app logic and Python-style thinking",
      mathFocus: "Percent accuracy, confusion counts, and data summaries",
      missionOutcome: "Prototype an AI mobile helper and defend design choices.",
      sessionBlueprint: "15 min plan, 28 min build, 10 min pitch",
      isPublished: true,
    },
    create: {
      id: "course-app-inventor",
      title: "AI App Inventor Studio",
      description:
        "Teens design mobile AI helpers, evaluate model accuracy, and present ethical product decisions.",
      gradeLevel: "Ages 11-14",
      ageBand: "11-14",
      pathwayStage: "Creator",
      aiFocus: "Model training, evaluation, and bias mitigation",
      codingFocus: "Event-driven app logic and Python-style thinking",
      mathFocus: "Percent accuracy, confusion counts, and data summaries",
      missionOutcome: "Prototype an AI mobile helper and defend design choices.",
      sessionBlueprint: "15 min plan, 28 min build, 10 min pitch",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-appstudio-1",
            title: "Collect Clean Training Data",
            videoId: "M7lc1UVf-VE",
            order: 1,
            notes: "Design data labels, gather balanced examples, and discuss where noisy data can mislead a model.",
            isPublished: true,
          },
          {
            id: "lesson-appstudio-2",
            title: "Build App Logic and Actions",
            videoId: "ysz5S6PUM-U",
            order: 2,
            notes: "Connect model outputs to app actions using event-driven logic and safety checks.",
            isPublished: true,
          },
          {
            id: "lesson-appstudio-3",
            title: "Evaluate Accuracy and Ethics",
            videoId: "aqz-KE-bpKQ",
            order: 3,
            notes: "Use percentage metrics to evaluate performance, then present one fairness and privacy improvement.",
            isPublished: true,
          },
        ],
      },
    },
  });

  const ownerKey = "seed-teacher";
  await prisma.teacherSchoolProfile.upsert({
    where: { ownerKey },
    update: {
      schoolName: "Kwa Njenga",
      country: "Kenya",
      appVersion: "4.1.0",
      deviceId: "lb-SEED0001",
      connectivityStatus: "OKAY",
      contentStatus: "UP_TO_DATE",
      supportEmail: "support@learnbridge.app",
      schoolQrCode: "LB-SEED-2026-PP",
    },
    create: {
      ownerKey,
      schoolName: "Kwa Njenga",
      country: "Kenya",
      appVersion: "4.1.0",
      deviceId: "lb-SEED0001",
      connectivityStatus: "OKAY",
      contentStatus: "UP_TO_DATE",
      supportEmail: "support@learnbridge.app",
      schoolQrCode: "LB-SEED-2026-PP",
    },
  });

  await prisma.teacherClassroom.upsert({
    where: { id: "class-seed-pp1" },
    update: {
      ownerKey,
      name: "Tr. Mary and Ashlyn",
      grade: "PP1",
      teacherName: "Mary Wanjiru",
      teacherPhone: "+254700000001",
      cardColor: "bg-rose-100",
      isArchived: false,
    },
    create: {
      id: "class-seed-pp1",
      ownerKey,
      name: "Tr. Mary and Ashlyn",
      grade: "PP1",
      teacherName: "Mary Wanjiru",
      teacherPhone: "+254700000001",
      cardColor: "bg-rose-100",
      isArchived: false,
    },
  });

  await prisma.teacherClassroom.upsert({
    where: { id: "class-seed-pp2" },
    update: {
      ownerKey,
      name: "Dorcas",
      grade: "PP2",
      teacherName: "Dorcas Achieng",
      teacherPhone: "+254700000002",
      cardColor: "bg-sky-100",
      isArchived: false,
    },
    create: {
      id: "class-seed-pp2",
      ownerKey,
      name: "Dorcas",
      grade: "PP2",
      teacherName: "Dorcas Achieng",
      teacherPhone: "+254700000002",
      cardColor: "bg-sky-100",
      isArchived: false,
    },
  });

  await prisma.teacherLearner.upsert({
    where: { id: "learner-seed-joy" },
    update: {
      classId: "class-seed-pp1",
      name: "Joy Nelima",
      avatarHue: 210,
      weeklyMinutes: 32,
      lastWeekMinutes: 19,
    },
    create: {
      id: "learner-seed-joy",
      classId: "class-seed-pp1",
      name: "Joy Nelima",
      avatarHue: 210,
      weeklyMinutes: 32,
      lastWeekMinutes: 19,
    },
  });

  await prisma.teacherLearner.upsert({
    where: { id: "learner-seed-glory" },
    update: {
      classId: "class-seed-pp1",
      name: "Glory Ndanu",
      avatarHue: 344,
      weeklyMinutes: 28,
      lastWeekMinutes: 17,
    },
    create: {
      id: "learner-seed-glory",
      classId: "class-seed-pp1",
      name: "Glory Ndanu",
      avatarHue: 344,
      weeklyMinutes: 28,
      lastWeekMinutes: 17,
    },
  });

  await prisma.teacherSessionStatus.upsert({
    where: {
      classId_learnerId_activityId: {
        classId: "class-seed-pp1",
        learnerId: "learner-seed-joy",
        activityId: "activity-sorting-grouping",
      },
    },
    update: {
      status: TeacherSessionLearnerStatus.PRACTICED_ENOUGH,
    },
    create: {
      classId: "class-seed-pp1",
      learnerId: "learner-seed-joy",
      activityId: "activity-sorting-grouping",
      status: TeacherSessionLearnerStatus.PRACTICED_ENOUGH,
    },
  });

  await prisma.teacherSessionStatus.upsert({
    where: {
      classId_learnerId_activityId: {
        classId: "class-seed-pp1",
        learnerId: "learner-seed-glory",
        activityId: "activity-sorting-grouping",
      },
    },
    update: {
      status: TeacherSessionLearnerStatus.KEEP_GOING,
    },
    create: {
      classId: "class-seed-pp1",
      learnerId: "learner-seed-glory",
      activityId: "activity-sorting-grouping",
      status: TeacherSessionLearnerStatus.KEEP_GOING,
    },
  });

  return course;
}

async function runSeedWithConnection(connectionString: string) {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  let lastError: unknown = null;

  for (const [index, connectionString] of connectionCandidates.entries()) {
    try {
      await runSeedWithConnection(connectionString);
      console.log(
        `Seed completed using ${hostFromConnectionString(connectionString)}.`,
      );
      return;
    } catch (error) {
      lastError = error;
      const hasFallback = index < connectionCandidates.length - 1;

      if (isConnectivityError(error) && hasFallback) {
        console.warn(
          `Seed connection failed for ${hostFromConnectionString(
            connectionString,
          )}; trying next database URL...`,
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Unable to seed database.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
