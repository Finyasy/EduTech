import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureLearnerByIdWithTimeout } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import {
  parseJsonBody,
  toDatabaseFailureResponse,
  withRouteTimeout,
} from "@/lib/server/request";

const USER_LOOKUP_TIMEOUT_MS = 1_500;

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
  if (userId) {
    const learnerCheck = await ensureLearnerByIdWithTimeout(
      userId,
      USER_LOOKUP_TIMEOUT_MS,
    );
    if (learnerCheck.status === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (learnerCheck.status === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = quizSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { lessonId, answers } = payload.data;

  let lesson;
  try {
    lesson = await withRouteTimeout(
      prisma.lesson.findFirst({
        where: { id: lessonId, isPublished: true },
        select: { id: true },
      }),
      "lesson lookup",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "quiz-lesson-lookup",
      userId,
      lessonId,
      operation: "lookup",
    });
  }

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  let questions;
  try {
    questions = await withRouteTimeout(
      prisma.quizQuestion.findMany({
        where: { lessonId },
        orderBy: { createdAt: "asc" },
      }),
      "quiz question lookup",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "quiz-questions-lookup",
      userId,
      lessonId,
      operation: "lookup",
    });
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No quiz questions for this lesson" },
      { status: 400 },
    );
  }

  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.answer.trim()]),
  );

  const includeAnswerKey = Boolean(userId);
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
      correctAnswer: includeAnswerKey ? question.answer : null,
      explanation: includeAnswerKey ? question.explanation ?? null : null,
    };
  });

  const score = results.filter((r) => r.correct).length;

  let saved = false;
  if (userId) {
    const learnerCheck = await ensureLearnerByIdWithTimeout(
      userId,
      USER_LOOKUP_TIMEOUT_MS,
    );
    if (learnerCheck.status !== "ok") {
      return NextResponse.json(
        { error: learnerCheck.status === "forbidden" ? "Forbidden" : "Unauthorized" },
        { status: learnerCheck.status === "forbidden" ? 403 : 401 },
      );
    }
    const user = learnerCheck.user;
    try {
      await withRouteTimeout(
        prisma.quizAttempt.create({
          data: {
            userId: user.id,
            lessonId,
            score,
          },
        }),
        "quiz attempt write",
      );
    } catch (error) {
      return toDatabaseFailureResponse(error, {
        context: "quiz-attempt-write",
        userId: user.id,
        lessonId,
        operation: "create",
      });
    }
    saved = true;
  }

  return NextResponse.json({
    score,
    total: questions.length,
    results,
    saved,
  });
}
