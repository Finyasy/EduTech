import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/server/request";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import { advanceLearnerProgressStatus } from "@/lib/server/teacher-store";

const advanceStatusSchema = z.object({
  activityId: z.string().min(1),
  learnerId: z.string().min(1),
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

  const payload = advanceStatusSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const nextStatus = await advanceLearnerProgressStatus({
      ownerKey,
      classId,
      activityId: payload.data.activityId,
      learnerId: payload.data.learnerId,
    });

    return NextResponse.json({ status: nextStatus });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update learner status.",
      },
      { status: 400 },
    );
  }
}
