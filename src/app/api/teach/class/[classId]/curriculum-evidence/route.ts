import { NextResponse } from "next/server";
import { getMathCurriculumRecordById } from "@/lib/curriculum/math-roadmap";
import { listTeacherClassCurriculumEvidence } from "@/lib/server/data";
import {
  isDatabaseFailureError,
  toDatabaseFailureResponse,
} from "@/lib/server/request";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";

type RouteParams = {
  params: Promise<{ classId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const requestUrl = new URL(request.url);
  const competencyId = requestUrl.searchParams.get("competencyId");

  if (!competencyId) {
    return NextResponse.json(
      { error: "competencyId is required" },
      { status: 400 },
    );
  }

  if (!getMathCurriculumRecordById(competencyId)) {
    return NextResponse.json({ error: "Competency not found" }, { status: 404 });
  }

  try {
    const evidence = await listTeacherClassCurriculumEvidence({
      ownerKey,
      classId,
      competencyId,
    });

    return NextResponse.json({
      classId,
      competencyId,
      evidence,
    });
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, {
        context: "teacher-class-curriculum-evidence",
        ownerKey,
        classId,
        competencyId,
        operation: "read",
      });
    }
    throw error;
  }
}
