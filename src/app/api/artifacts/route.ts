import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureLearnerByIdWithTimeout } from "@/lib/server/auth";
import {
  listLearnerArtifactsForLesson,
  type LearnerArtifactSummary,
} from "@/lib/server/data";
import { getPrisma } from "@/lib/server/prisma";
import {
  isDatabaseFailureError,
  parseJsonBody,
  toDatabaseFailureResponse,
  withRouteTimeout,
} from "@/lib/server/request";

const USER_LOOKUP_TIMEOUT_MS = 1_500;

const artifactQuerySchema = z.object({
  lessonId: z.string().min(1),
});

const optionalUrlSchema = z
  .string()
  .trim()
  .url()
  .or(z.literal(""))
  .nullable()
  .optional();

const artifactSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  buildType: z.string().trim().min(2).max(80),
  reflection: z.string().trim().min(10).max(1200),
  artifactUrl: optionalUrlSchema,
});

const toNullableUrl = (value: z.infer<typeof optionalUrlSchema>) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const payload = artifactQuerySchema.safeParse({
    lessonId: url.searchParams.get("lessonId"),
  });

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid query", details: payload.error.flatten() },
      { status: 400 },
    );
  }

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

  let artifacts;
  try {
    artifacts = await listLearnerArtifactsForLesson(
      userId,
      payload.data.lessonId,
    );
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, {
        context: "learner-artifacts-list",
        userId,
        lessonId: payload.data.lessonId,
        operation: "list",
      });
    }
    throw error;
  }

  return NextResponse.json({ artifacts });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const payload = artifactSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

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
  const user = learnerCheck.user;

  let lesson;
  try {
    lesson = await withRouteTimeout(
      prisma.lesson.findUnique({
        where: { id: payload.data.lessonId },
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { title: true } },
        },
      }),
      "artifact lesson lookup",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "artifact-lesson-lookup",
      userId: user.id,
      lessonId: payload.data.lessonId,
      operation: "lookup",
    });
  }
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  let artifact;
  try {
    artifact = await withRouteTimeout(
      prisma.learnerArtifact.create({
        data: {
          userId,
          lessonId: payload.data.lessonId,
          title: payload.data.title,
          buildType: payload.data.buildType,
          reflection: payload.data.reflection,
          artifactUrl: toNullableUrl(payload.data.artifactUrl),
        },
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
      "artifact write",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "artifact-write",
      userId: user.id,
      lessonId: payload.data.lessonId,
      operation: "create",
    });
  }

  const summary: LearnerArtifactSummary = {
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
  };

  return NextResponse.json({ ok: true, artifact: summary });
}
