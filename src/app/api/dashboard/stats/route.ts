import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  ensureUserByIdWithTimeout,
  isLearnerRole,
} from "@/lib/server/auth";
import { getDashboardStats } from "@/lib/server/data";

const authTimeoutMs = 1_500;
const learnerLookupTimeoutMs = 1_500;
const statsTimeoutMs = 2_400;

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

  const user = await withTimeout(
    ensureUserByIdWithTimeout(userId, learnerLookupTimeoutMs),
    learnerLookupTimeoutMs,
  );

  if (user && !isLearnerRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Signed-in learners should stay on the dashboard even if user provisioning
  // or the DB is temporarily slow. Return fallback stats instead of bouncing
  // them back through sign-in.
  if (!user) {
    return NextResponse.json(
      {
        continueWatching: null,
        completedTotal: 0,
        completedThisWeek: 0,
        streakDays: 0,
        mastery: { ai: 0, coding: 0, math: 0 },
        isFallbackData: true,
      },
      { status: 200 },
    );
  }

  const stats = await withTimeout(getDashboardStats(userId), statsTimeoutMs);
  if (!stats) {
    return NextResponse.json(
      {
        continueWatching: null,
        completedTotal: 0,
        completedThisWeek: 0,
        streakDays: 0,
        mastery: { ai: 0, coding: 0, math: 0 },
        isFallbackData: true,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(stats);
}
