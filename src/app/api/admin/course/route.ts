import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/server/prisma";
import { requireAdmin } from "@/lib/server/auth";
import { parseJsonBody } from "@/lib/server/request";

const ageBandSchema = z.enum(["5-7", "8-10", "11-14"]);
const pathwayStageSchema = z.enum(["Explorer", "Builder", "Creator"]);
const optionalFieldSchema = z.string().trim().min(2).max(180).nullable().optional();

const courseSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(5),
  gradeLevel: z.string().trim().min(2),
  ageBand: ageBandSchema.nullable().optional(),
  pathwayStage: pathwayStageSchema.nullable().optional(),
  aiFocus: optionalFieldSchema,
  codingFocus: optionalFieldSchema,
  mathFocus: optionalFieldSchema,
  missionOutcome: z.string().trim().min(2).max(240).nullable().optional(),
  sessionBlueprint: z.string().trim().min(2).max(120).nullable().optional(),
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

  const payload = courseSchema.safeParse(parsedBody.data);
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
      ageBand: payload.data.ageBand ?? null,
      pathwayStage: payload.data.pathwayStage ?? null,
      aiFocus: payload.data.aiFocus ?? null,
      codingFocus: payload.data.codingFocus ?? null,
      mathFocus: payload.data.mathFocus ?? null,
      missionOutcome: payload.data.missionOutcome ?? null,
      sessionBlueprint: payload.data.sessionBlueprint ?? null,
      isPublished: payload.data.isPublished ?? false,
    },
  });

  revalidateTag("courses", { expire: 0 });
  revalidateTag(`course:${course.id}`, { expire: 0 });

  return NextResponse.json({ ok: true, courseId: course.id });
}
