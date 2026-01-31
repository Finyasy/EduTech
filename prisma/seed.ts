import { PrismaClient, QuestionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.upsert({
    where: { id: "course-logic" },
    update: {},
    create: {
      id: "course-logic",
      title: "Logic Explorers",
      description: "Patterns, sequences, and critical thinking challenges.",
      gradeLevel: "Grades 3-5",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-logic-1",
            title: "Spot the Pattern",
            videoId: "mC6Y9xq-0RA",
            order: 1,
            notes: "Find the next item in a pattern and explain your reasoning.",
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
            title: "Logic Grids",
            videoId: "8qjV4yjiBrg",
            order: 2,
            notes: "Solve puzzles using clues and elimination.",
            isPublished: true,
          },
          {
            id: "lesson-logic-3",
            title: "If-Then Thinking",
            videoId: "hEV6G2-15R4",
            order: 3,
            notes: "Use if-then statements to solve simple mysteries.",
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
    update: {},
    create: {
      id: "course-math",
      title: "Math Adventures",
      description: "Numbers, fractions, and problem-solving quests.",
      gradeLevel: "Grades 4-6",
      isPublished: true,
      lessons: {
        create: [
          {
            id: "lesson-math-1",
            title: "Fractions in the Wild",
            videoId: "4lkds9NL2qg",
            order: 1,
            notes: "Fractions show up in cooking, building, and sports.",
            isPublished: true,
          },
          {
            id: "lesson-math-2",
            title: "Multiplication Tricks",
            videoId: "t2D1dGyG2A0",
            order: 2,
            notes: "Practice quick tricks to multiply numbers faster.",
            isPublished: true,
          },
          {
            id: "lesson-math-3",
            title: "Solve the Word Problem",
            videoId: "nV0qKMh8Yx4",
            order: 3,
            notes: "Break down word problems into simple steps.",
            isPublished: true,
          },
        ],
      },
    },
  });

  return course;
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
