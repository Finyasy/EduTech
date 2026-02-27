import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";
import { parseJsonBody } from "@/lib/server/request";
import { normalizeYouTubeVideoId } from "@/lib/youtube";

const updateLessonSchema = z.object({
  courseId: z.string().min(1).optional(),
  title: z.string().min(2).optional(),
  videoId: z.string().min(4).optional(),
  order: z.number().int().min(1).optional(),
  notes: z.string().min(5).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: adminCheck.status },
    );
  }

  const { lessonId } = await params;
  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = updateLessonSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const updateData = { ...payload.data };

  if (updateData.videoId !== undefined) {
    const normalizedVideoId = normalizeYouTubeVideoId(updateData.videoId);
    if (!normalizedVideoId) {
      return NextResponse.json(
        { error: "Provide a valid YouTube video ID or URL." },
        { status: 400 },
      );
    }
    updateData.videoId = normalizedVideoId;
  }

  if (updateData.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: updateData.courseId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
  }

  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    revalidateTag("courses", { expire: 0 });
    revalidateTag(`lesson:${lessonId}`, { expire: 0 });
    revalidateTag(`course:${existing.courseId}`, { expire: 0 });
    revalidateTag(`lessons:${existing.courseId}`, { expire: 0 });
    if (updateData.courseId && updateData.courseId !== existing.courseId) {
      revalidateTag(`course:${updateData.courseId}`, { expire: 0 });
      revalidateTag(`lessons:${updateData.courseId}`, { expire: 0 });
    }

    return NextResponse.json({ ok: true, lesson });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Lesson order already exists for this course." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Unable to update lesson." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: adminCheck.status },
    );
  }

  const { lessonId } = await params;
  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.quizAttempt.deleteMany({ where: { lessonId } }),
    prisma.lessonProgress.deleteMany({ where: { lessonId } }),
    prisma.quizQuestion.deleteMany({ where: { lessonId } }),
    prisma.lesson.delete({ where: { id: lessonId } }),
  ]);

  revalidateTag("courses", { expire: 0 });
  revalidateTag(`lesson:${lessonId}`, { expire: 0 });
  revalidateTag(`course:${existing.courseId}`, { expire: 0 });
  revalidateTag(`lessons:${existing.courseId}`, { expire: 0 });

  return NextResponse.json({ ok: true });
}
