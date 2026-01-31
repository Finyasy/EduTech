import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";

const lessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2),
  videoId: z.string().min(4),
  order: z.number().int().min(1),
  notes: z.string().min(5),
  isPublished: z.boolean().optional(),
});

export async function POST(request: Request) {
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

  const payload = lessonSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const course = await prisma.course.findUnique({
    where: { id: payload.data.courseId },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  try {
    const lesson = await prisma.lesson.create({
      data: {
        courseId: payload.data.courseId,
        title: payload.data.title,
        videoId: payload.data.videoId,
        order: payload.data.order,
        notes: payload.data.notes,
        isPublished: payload.data.isPublished ?? false,
      },
    });

    return NextResponse.json({ ok: true, lessonId: lesson.id });
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
    return NextResponse.json({ error: "Unable to create lesson." }, { status: 500 });
  }
}
