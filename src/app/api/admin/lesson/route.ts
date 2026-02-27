import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";
import { parseJsonBody } from "@/lib/server/request";
import { normalizeYouTubeVideoId } from "@/lib/youtube";

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

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = lessonSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const normalizedVideoId = normalizeYouTubeVideoId(payload.data.videoId);
  if (!normalizedVideoId) {
    return NextResponse.json(
      { error: "Provide a valid YouTube video ID or URL." },
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
        videoId: normalizedVideoId,
        order: payload.data.order,
        notes: payload.data.notes,
        isPublished: payload.data.isPublished ?? false,
      },
    });

    revalidateTag("courses", { expire: 0 });
    revalidateTag(`course:${payload.data.courseId}`, { expire: 0 });
    revalidateTag(`lessons:${payload.data.courseId}`, { expire: 0 });

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
