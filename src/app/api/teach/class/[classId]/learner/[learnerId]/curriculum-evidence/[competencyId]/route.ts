import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getMathCurriculumRecordById,
  type MathCurriculumRubricLevel,
  type MathCurriculumSupportLevel,
} from "@/lib/curriculum/math-roadmap";
import { getTeacherOwnerKey } from "@/lib/server/teach-access";
import {
  isDatabaseFailureError,
  parseJsonBody,
  toDatabaseFailureResponse,
} from "@/lib/server/request";
import { upsertTeacherLearnerCurriculumEvidence } from "@/lib/server/teacher-store";

const rubricLevelSchema = z.enum([
  "EXCEEDS_EXPECTATION",
  "MEETS_EXPECTATION",
  "APPROACHES_EXPECTATION",
  "BELOW_EXPECTATION",
]);

const supportLevelSchema = z.enum([
  "INDEPENDENT",
  "NORMAL_INSTRUCTION",
  "PROMPTS",
  "DIRECT_GUIDANCE",
]);

const payloadSchema = z.object({
  note: z.string().trim().max(1000).optional().nullable(),
  rubricLevelOverride: rubricLevelSchema.optional().nullable(),
  supportLevelOverride: supportLevelSchema.optional().nullable(),
  countedEachObjectOnce: z.boolean().optional(),
  skippedDoubleCounted: z.boolean().optional(),
  matchedNumeralCorrectly: z.boolean().optional(),
  neededPrompts: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{
    classId: string;
    learnerId: string;
    competencyId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const ownerKey = await getTeacherOwnerKey();
  if (!ownerKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = payloadSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { classId, learnerId, competencyId } = await params;
  const curriculumRecord = getMathCurriculumRecordById(competencyId);
  if (!curriculumRecord) {
    return NextResponse.json({ error: "Competency not found" }, { status: 404 });
  }

  try {
    const teacherJudgement = await upsertTeacherLearnerCurriculumEvidence({
      ownerKey,
      classId,
      learnerId,
      competencyId,
      note: payload.data.note?.trim() || null,
      rubricLevelOverride:
        (payload.data.rubricLevelOverride as MathCurriculumRubricLevel | null | undefined) ??
        null,
      supportLevelOverride:
        (payload.data.supportLevelOverride as MathCurriculumSupportLevel | null | undefined) ??
        null,
      countedEachObjectOnce: payload.data.countedEachObjectOnce ?? false,
      skippedDoubleCounted: payload.data.skippedDoubleCounted ?? false,
      matchedNumeralCorrectly: payload.data.matchedNumeralCorrectly ?? false,
      neededPrompts: payload.data.neededPrompts ?? false,
    });

    return NextResponse.json({
      competencyId: curriculumRecord.id,
      teacherJudgement,
    });
  } catch (error) {
    if (isDatabaseFailureError(error)) {
      return toDatabaseFailureResponse(error, {
        context: "teacher-learner-curriculum-evidence-write",
        ownerKey,
        classId,
        learnerId,
        competencyId,
        operation: "upsert",
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save teacher evidence.",
      },
      { status: 400 },
    );
  }
}
