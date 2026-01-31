import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";

const courseSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  gradeLevel: z.string().min(2),
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

  const payload = courseSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const course = await prisma.course.create({
    data: {
      title: payload.data.title,
      description: payload.data.description,
      gradeLevel: payload.data.gradeLevel,
      isPublished: payload.data.isPublished ?? false,
    },
  });

  return NextResponse.json({ ok: true, courseId: course.id });
}
