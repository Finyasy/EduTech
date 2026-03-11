import { NextResponse } from "next/server";
import { z } from "zod";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import { getTeacherWorkspaceSnapshot } from "@/lib/server/teacher-store";

const querySchema = z.object({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  strandId: z.string().optional(),
  activityId: z.string().optional(),
  detail: z.enum(["core", "full"]).optional(),
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
    detail: url.searchParams.get("detail") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const workspace = await getTeacherWorkspaceSnapshot(
    {
      ownerKey,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      strandId: parsed.data.strandId,
      activityId: parsed.data.activityId,
    },
    {
      detailLevel: parsed.data.detail ?? "full",
    },
  );

  return NextResponse.json(workspace);
}
