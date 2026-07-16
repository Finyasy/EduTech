import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureLearnerByIdWithTimeout } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import {
  parseJsonBody,
  toDatabaseFailureResponse,
  withRouteTimeout,
} from "@/lib/server/request";

const USER_LOOKUP_TIMEOUT_MS = 1_500;

const attemptSchema = z.object({
  gameLevelId: z.string().min(1),
  score: z.number().int().min(0),
  timeMs: z.number().int().min(0),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
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

  const payload = attemptSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const learnerCheck = await ensureLearnerByIdWithTimeout(
    userId,
    USER_LOOKUP_TIMEOUT_MS,
  );
  if (learnerCheck.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (learnerCheck.status === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = learnerCheck.user;

  const { gameLevelId, score, timeMs } = payload.data;

  let level;
  try {
    level = await withRouteTimeout(
      prisma.gameLevel.findUnique({
        where: { id: gameLevelId },
      }),
      "game level lookup",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "game-attempt-level-lookup",
      userId,
      gameLevelId,
      operation: "lookup",
    });
  }
  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  try {
    await withRouteTimeout(
      prisma.gameAttempt.create({
        data: {
          userId: user.id,
          gameLevelId,
          score,
          timeMs,
        },
      }),
      "game attempt write",
    );
  } catch (error) {
    return toDatabaseFailureResponse(error, {
      context: "game-attempt-write",
      userId: user.id,
      gameLevelId,
      operation: "create",
    });
  }

  return NextResponse.json({ ok: true });
}
