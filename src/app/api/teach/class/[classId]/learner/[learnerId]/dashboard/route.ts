import { NextResponse } from "next/server";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import { getTeacherLearnerDashboardSummary } from "@/lib/server/data";
import {
  isDatabaseFailureError,
  toDatabaseFailureResponse,
} from "@/lib/server/request";

type RouteParams = {
  params: Promise<{ classId: string; learnerId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, learnerId } = await params;

  try {
    const summary = await getTeacherLearnerDashboardSummary({
      ownerKey,
      classId,
      learnerId,
    });

    if (!summary) {
      return NextResponse.json({ error: "Learner not found" }, { status: 404 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, {
        context: "teacher-learner-dashboard",
        ownerKey,
        classId,
        learnerId,
        operation: "read",
      });
    }
    throw error;
  }
}
