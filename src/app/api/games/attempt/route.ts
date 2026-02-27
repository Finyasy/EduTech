import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureUser } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { parseJsonBody } from "@/lib/server/request";

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

  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameLevelId, score, timeMs } = payload.data;

  const level = await prisma.gameLevel.findUnique({
    where: { id: gameLevelId },
  });
  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  await prisma.gameAttempt.create({
    data: {
      userId: user.id,
      gameLevelId,
      score,
      timeMs,
    },
  });

  return NextResponse.json({ ok: true });
}
