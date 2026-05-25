import { NextResponse } from "next/server";
import { z } from "zod";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import { getTeacherWorkspaceAssignments } from "@/lib/server/teacher-store";
import {
  isDatabaseFailureError,
  toDatabaseFailureResponse,
} from "@/lib/server/request";

const querySchema = z.object({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  strandId: z.string().optional(),
  activityId: z.string().optional(),
});

export async function GET(request: Request) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    classId: url.searchParams.get("classId") ?? undefined,
    subjectId: url.searchParams.get("subjectId") ?? undefined,
    strandId: url.searchParams.get("strandId") ?? undefined,
    activityId: url.searchParams.get("activityId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let assignments;
  try {
    assignments = await getTeacherWorkspaceAssignments({
      ownerKey,
      ...parsed.data,
    });
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, "teacher-workspace-assignments");
    }
    throw error;
  }

  return NextResponse.json(assignments);
}
