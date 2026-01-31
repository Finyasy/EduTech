import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureUser } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const quizSchema = z.object({
  lessonId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string(),
    }),
  ),
});

const normalizeShortAnswer = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeMultipleChoice = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  const { userId } = await auth();

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const payload = quizSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { lessonId, answers } = payload.data;

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, isPublished: true },
    select: { id: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const questions = await prisma.quizQuestion.findMany({
    where: { lessonId },
    orderBy: { createdAt: "asc" },
  });

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No quiz questions for this lesson" },
      { status: 400 },
    );
  }

  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.answer.trim()]),
  );

  const results = questions.map((question) => {
    const given = answerMap.get(question.id);
    const normalizedGiven =
      question.type === "SHORT_ANSWER"
        ? normalizeShortAnswer(given ?? "")
        : normalizeMultipleChoice(given ?? "");
    const normalizedCorrect =
      question.type === "SHORT_ANSWER"
        ? normalizeShortAnswer(question.answer)
        : normalizeMultipleChoice(question.answer);
    const correct = Boolean(given) && normalizedGiven === normalizedCorrect;
    return {
      questionId: question.id,
      correct,
      correctAnswer: question.answer,
      explanation: question.explanation ?? null,
    };
  });

  const score = results.filter((r) => r.correct).length;

  let saved = false;
  if (userId) {
    const user = await ensureUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        lessonId,
        score,
      },
    });
    saved = true;
  }

  return NextResponse.json({
    score,
    total: questions.length,
    results,
    saved,
  });
}
