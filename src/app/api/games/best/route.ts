import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureUser } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { parseJsonBody } from "@/lib/server/request";

const bestQuerySchema = z.object({
  gameId: z.string().min(1),
});

const bestPayloadSchema = z.object({
  gameId: z.string().min(1),
  bestScore: z.number().int().min(0),
  bestTimeMs: z.number().int().min(0),
});

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const payload = bestQuerySchema.safeParse({
    gameId: url.searchParams.get("gameId"),
  });
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid query", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const best = await prisma.gameBest.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId: payload.data.gameId,
      },
    },
  });

  return NextResponse.json({
    bestScore: best?.bestScore ?? null,
    bestTimeMs: best?.bestTimeMs ?? null,
  });
}

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

  const payload = bestPayloadSchema.safeParse(parsedBody.data);
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

  const game = await prisma.game.findUnique({
    where: { id: payload.data.gameId },
    select: { id: true },
  });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const existing = await prisma.gameBest.findUnique({
    where: {
      userId_gameId: {
        userId: user.id,
        gameId: payload.data.gameId,
      },
    },
  });

  const incoming = {
    bestScore: payload.data.bestScore,
    bestTimeMs: payload.data.bestTimeMs,
  };

  const shouldUpdate =
    !existing ||
    incoming.bestScore > existing.bestScore ||
    (incoming.bestScore === existing.bestScore &&
      incoming.bestTimeMs < existing.bestTimeMs);

  if (!shouldUpdate && existing) {
    return NextResponse.json({
      ok: true,
      bestScore: existing.bestScore,
      bestTimeMs: existing.bestTimeMs,
      updated: false,
    });
  }

  const best = existing
    ? await prisma.gameBest.update({
        where: { id: existing.id },
        data: incoming,
      })
    : await prisma.gameBest.create({
        data: {
          userId: user.id,
          gameId: payload.data.gameId,
          ...incoming,
        },
      });

  return NextResponse.json({
    ok: true,
    bestScore: best.bestScore,
    bestTimeMs: best.bestTimeMs,
    updated: true,
  });
}
