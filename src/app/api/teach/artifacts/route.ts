import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/auth";
import {
  listRecentLearnerArtifacts,
  listRecentLearnerArtifactsForClass,
} from "@/lib/server/data";
import {
  isDatabaseFailureError,
  toDatabaseFailureResponse,
} from "@/lib/server/request";

export async function GET(request: Request) {
  const staffCheck = await requireStaff();
  if (!staffCheck.ok) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: staffCheck.status },
    );
  }
  if (!staffCheck.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 12);
  const safeLimit = Number.isFinite(limit) ? limit : 12;
  const classId = url.searchParams.get("classId");
  let artifacts;
  try {
    artifacts = classId
      ? await listRecentLearnerArtifactsForClass(
          staffCheck.user.id,
          classId,
          safeLimit,
        )
      : await listRecentLearnerArtifacts(safeLimit);
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, "teacher-artifacts-list");
    }
    throw error;
  }

  return NextResponse.json({ artifacts });
}
