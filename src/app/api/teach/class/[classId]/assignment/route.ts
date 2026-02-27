import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/server/request";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import { assignTeacherMissionToClass } from "@/lib/server/teacher-store";

const assignmentSchema = z.object({
  courseId: z.string().min(1),
  courseTitle: z.string().min(1),
  target: z.enum(["CLASS", "NEEDS_PRACTICE"]),
  subjectId: z.string().min(1).optional(),
  strandId: z.string().min(1).optional(),
  activityId: z.string().min(1).optional(),
  learnerIds: z.array(z.string().min(1)).optional(),
  note: z.string().max(240).optional(),
});

type RouteParams = {
  params: Promise<{ classId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = assignmentSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const assignment = await assignTeacherMissionToClass({
      ownerKey,
      classId,
      ...payload.data,
      subjectId: payload.data.subjectId ?? null,
      strandId: payload.data.strandId ?? null,
      activityId: payload.data.activityId ?? null,
      note: payload.data.note ?? null,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to assign mission.",
      },
      { status: 400 },
    );
  }
}
