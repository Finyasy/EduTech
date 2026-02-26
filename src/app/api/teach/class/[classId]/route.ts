import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/server/request";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import {
  archiveTeacherClassroom,
  restoreTeacherClassroom,
  updateTeacherClassroom,
} from "@/lib/server/teacher-store";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    name: z.string().min(1).optional(),
    grade: z.string().min(1).optional(),
    teacherName: z.string().min(1).optional(),
    teacherPhone: z.string().min(1).optional(),
  }),
  z.object({
    action: z.literal("archive"),
  }),
  z.object({
    action: z.literal("restore"),
  }),
]);

type RouteParams = {
  params: Promise<{ classId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = actionSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    if (payload.data.action === "update") {
      const classroom = await updateTeacherClassroom(
        ownerKey,
        classId,
        payload.data,
      );
      return NextResponse.json({ classroom });
    }

    if (payload.data.action === "archive") {
      const classroom = await archiveTeacherClassroom(ownerKey, classId);
      return NextResponse.json({ classroom });
    }

    const classroom = await restoreTeacherClassroom(ownerKey, classId);
    return NextResponse.json({ classroom });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update class.",
      },
      { status: 400 },
    );
  }
}
