import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ensureUser } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { parseJsonBody } from "@/lib/server/request";

const progressSchema = z.object({
  lessonId: z.string().min(1),
  watchPercent: z.number().min(0).max(100),
  completed: z.boolean().optional(),
});

const progressQuerySchema = z.object({
  lessonId: z.string().min(1),
});

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const payload = progressQuerySchema.safeParse({
    lessonId: url.searchParams.get("lessonId"),
  });

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid query", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId: payload.data.lessonId,
      },
    },
    select: {
      watchPercent: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    watchPercent: progress?.watchPercent ?? 0,
    completedAt: progress?.completedAt ?? null,
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const payload = progressSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 501 },
    );
  }

  const { lessonId, watchPercent, completed } = payload.data;
  const completedAt =
    completed === undefined ? undefined : completed ? new Date() : null;

  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      watchPercent,
      completedAt,
    },
    create: {
      userId,
      lessonId,
      watchPercent,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidateTag(`dashboard-stats:${user.id}`, { expire: 0 });

  return NextResponse.json({ ok: true });
}
