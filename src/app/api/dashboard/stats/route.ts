import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDashboardStats } from "@/lib/server/data";

const authTimeoutMs = 1_000;
const statsTimeoutMs = 900;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
}

export async function GET() {
  const authResult = await withTimeout(auth(), authTimeoutMs);
  const userId = authResult?.userId ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await withTimeout(getDashboardStats(userId), statsTimeoutMs);
  if (!stats) {
    return NextResponse.json(
      {
        continueWatching: null,
        completedTotal: 0,
        completedThisWeek: 0,
        streakDays: 0,
        isFallbackData: true,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(stats);
}
