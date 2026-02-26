import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/server/request";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import { addTeacherClassroom } from "@/lib/server/teacher-store";

const createClassSchema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1),
  teacherName: z.string().min(1),
  teacherPhone: z.string().min(1),
  acceptDeviceTerms: z.boolean(),
  acceptDataPolicy: z.boolean(),
});

export async function POST(request: Request) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = createClassSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const classroom = await addTeacherClassroom(ownerKey, payload.data);
    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add class." },
      { status: 400 },
    );
  }
}
