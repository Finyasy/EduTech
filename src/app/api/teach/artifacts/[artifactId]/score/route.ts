import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import type { MasteryDimension, Prisma } from "@prisma/client";
import { requireStaff } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import {
  parseJsonBody,
  toDatabaseFailureResponse,
  withRouteTimeout,
} from "@/lib/server/request";

const scoreSchema = z.object({
  scores: z.object({
    ai: z.number().int().min(0).max(4),
    coding: z.number().int().min(0).max(4),
    math: z.number().int().min(0).max(4),
  }),
  feedback: z.string().trim().max(1000).optional(),
});

type RouteParams = {
  params: Promise<{ artifactId: string }>;
};

const DEFAULT_RUBRICS: Array<{
  key: keyof z.infer<typeof scoreSchema>["scores"];
  dimension: MasteryDimension;
  label: string;
  description: string;
}> = [
  {
    key: "ai",
    dimension: "AI",
    label: "AI concept explanation",
    description: "Explains the AI concept, model behavior, or safe-use decision in context.",
  },
  {
    key: "coding",
    dimension: "CODING",
    label: "Coding and debugging evidence",
    description: "Shows logical steps, testing, debugging, or implementation choices.",
  },
  {
    key: "math",
    dimension: "MATH",
    label: "Math reasoning",
    description: "Connects the build to patterns, quantities, data, measurement, or proof.",
  },
];

async function getOrCreateRubric(
  tx: Prisma.TransactionClient,
  rubric: (typeof DEFAULT_RUBRICS)[number],
) {
  const existing = await tx.masteryRubric.findFirst({
    where: { dimension: rubric.dimension, label: rubric.label },
    select: { id: true },
  });
  if (existing) {
    return existing;
  }

  return tx.masteryRubric.create({
    data: {
      dimension: rubric.dimension,
      label: rubric.label,
      description: rubric.description,
      maxScore: 4,
    },
    select: { id: true },
  });
}

export async function POST(request: Request, { params }: RouteParams) {
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

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = scoreSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { artifactId } = await params;
  const feedback = payload.data.feedback?.trim() || null;

  let artifact;
  try {
    artifact = await withRouteTimeout(
      prisma.$transaction(async (tx) => {
        const existingArtifact = await tx.learnerArtifact.findUnique({
          where: { id: artifactId },
          select: { id: true, userId: true },
        });
        if (!existingArtifact) {
          return null;
        }

        const assessedAt = new Date();
        await Promise.all(
          DEFAULT_RUBRICS.map(async (rubric) => {
            const storedRubric = await getOrCreateRubric(tx, rubric);
            await tx.masteryScore.upsert({
              where: {
                artifactId_rubricId: {
                  artifactId,
                  rubricId: storedRubric.id,
                },
              },
              update: {
                userId: existingArtifact.userId,
                score: payload.data.scores[rubric.key],
                feedback,
                assessedAt,
              },
              create: {
                artifactId,
                rubricId: storedRubric.id,
                userId: existingArtifact.userId,
                score: payload.data.scores[rubric.key],
                feedback,
                assessedAt,
              },
            });
          }),
        );

        return tx.learnerArtifact.update({
          where: { id: artifactId },
          data: { status: "REVIEWED" },
          select: { id: true, userId: true, status: true },
        });
      }),
      "teacher artifact scoring",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "teacher-artifact-scoring",
      artifactId,
      userId: staffCheck.user.id,
      operation: "transaction",
    });
  }

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  revalidateTag(`dashboard-stats:${artifact.userId}`, { expire: 0 });

  return NextResponse.json({ ok: true, artifact });
}
