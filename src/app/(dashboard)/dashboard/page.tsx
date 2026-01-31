import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { ensureUser } from "@/lib/server/auth";
import { getDashboardStats } from "@/lib/server/data";

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key?.endsWith("..."));
}

export default async function DashboardPage() {
  const clerkOn = isClerkConfigured();
  const user = clerkOn ? await ensureUser() : null;

  if (clerkOn && !user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`);
  }

  const stats = user
    ? await getDashboardStats(user.id)
    : {
        continueWatching: null,
        completedTotal: 0,
        completedThisWeek: 0,
        streakDays: 0,
      };

  const greeting = user
    ? user.name?.split(/\s+/)[0] ?? user.email?.split("@")[0] ?? "explorer"
    : "explorer";

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Student dashboard
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back, {greeting}.
          </h1>
          <p className="max-w-2xl text-slate-700">
            Track your progress, keep your streak alive, and jump back into the
            next lesson.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-3">
          {/* Continue watching */}
          <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Continue watching
            </p>
            {stats.continueWatching ? (
              <>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {stats.continueWatching.watchPercent}%
                </p>
                <p className="text-sm text-slate-600">
                  {stats.continueWatching.courseTitle} ·{" "}
                  {stats.continueWatching.lessonTitle}
                </p>
                <Link
                  href={stats.continueWatching.href}
                  className="mt-4 inline-block text-sm font-semibold text-orange-600 underline decoration-orange-200 transition hover:text-orange-700"
                >
                  Resume lesson →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  Pick a lesson
                </p>
                <p className="text-sm text-slate-600">
                  Start a course to see your progress here.
                </p>
                <Link
                  href="/courses"
                  className="mt-4 inline-block text-sm font-semibold text-orange-600 underline decoration-orange-200 transition hover:text-orange-700"
                >
                  Explore courses →
                </Link>
              </>
            )}
          </article>

          {/* Streak */}
          <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Streak
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {stats.streakDays === 0
                ? "Start one!"
                : `${stats.streakDays} day${stats.streakDays === 1 ? "" : "s"}`}
            </p>
            <p className="text-sm text-slate-600">
              {stats.streakDays === 0
                ? "Complete a lesson to begin your streak."
                : "Keep it up! Complete a lesson today."}
            </p>
          </article>

          {/* Completed */}
          <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Completed
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {stats.completedTotal} lesson
              {stats.completedTotal === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-slate-600">
              {stats.completedThisWeek} this week
            </p>
            {stats.completedTotal > 0 && (
              <Link
                href="/courses"
                className="mt-4 inline-block text-sm font-semibold text-orange-600 underline decoration-orange-200 transition hover:text-orange-700"
              >
                View courses →
              </Link>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
