import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";

const updateCourseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  gradeLevel: z.string().min(2).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
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

  const { courseId } = await params;
  const payload = updateCourseSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: payload.data,
  });
  return NextResponse.json({ ok: true, course });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
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

  const { courseId } = await params;
  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { select: { id: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const lessonIds = existing.lessons.map((l) => l.id);

  await prisma.$transaction([
    prisma.quizAttempt.deleteMany({ where: { lessonId: { in: lessonIds } } }),
    prisma.lessonProgress.deleteMany({
      where: { lessonId: { in: lessonIds } },
    }),
    prisma.quizQuestion.deleteMany({ where: { lessonId: { in: lessonIds } } }),
    prisma.lesson.deleteMany({ where: { courseId } }),
    prisma.course.delete({ where: { id: courseId } }),
  ]);

  return NextResponse.json({ ok: true });
}
