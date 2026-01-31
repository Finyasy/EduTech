import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";

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
  const payload = updateLessonSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  if (payload.data.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: payload.data.courseId },
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
      data: payload.data,
    });
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

  return NextResponse.json({ ok: true });
}
