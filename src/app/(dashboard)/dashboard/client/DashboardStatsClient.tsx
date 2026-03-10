"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getLearnerBadgesFromStats,
  getLearnerRecommendationFromStats,
} from "@/lib/curriculum/learning-path";
import type { DashboardStats } from "@/lib/server/data";

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const statsRequestTimeoutMs = 3_800;
const fallbackStats: DashboardStats = {
  continueWatching: null,
  completedTotal: 0,
  completedThisWeek: 0,
  streakDays: 0,
};

export default function DashboardStatsClient() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(fallbackStats);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), statsRequestTimeoutMs);

    const load = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          router.replace(`/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`);
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to load dashboard stats.");
        }
        const data = (await response.json()) as DashboardStats;
        if (!cancelled) {
          setStats(data);
        }
      } catch {
        if (cancelled) {
          return;
        }
        setStats({ ...fallbackStats, isFallbackData: true });
      }
    };

    load();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [router]);

  const aiMastery = clampPercent(stats.completedTotal * 12 + stats.completedThisWeek * 8);
  const codingMastery = clampPercent(stats.completedTotal * 10 + stats.streakDays * 5);
  const mathMastery = clampPercent(stats.completedTotal * 9 + stats.completedThisWeek * 10);
  const badges = getLearnerBadgesFromStats(stats);
  const nextMission = getLearnerRecommendationFromStats(stats);
  const dailyGoalMinutes = stats.completedTotal > 0 ? 20 : 10;
  const todayProgressEstimate = Math.min(
    dailyGoalMinutes,
    stats.completedThisWeek * 6 +
      Math.round((stats.continueWatching?.watchPercent ?? 0) / 15) +
      (stats.streakDays > 0 ? 2 : 0),
  );
  const dailyGoalPercent = clampPercent(
    Math.round((todayProgressEstimate / dailyGoalMinutes) * 100),
  );

  return (
    <div className="space-y-6">
      {stats.isFallbackData && (
        <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
          Data may be delayed
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] p-6 text-white shadow-skyline md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/58">
            Progress cockpit
          </p>
          {stats.continueWatching ? (
            <>
              <h2
                className="mt-3 text-3xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Resume {stats.continueWatching.lessonTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                {stats.continueWatching.courseTitle} is already in motion. Pick up where you left
                off and turn today&apos;s focus into visible progress.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/52">
                    Resume point
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.continueWatching.watchPercent}%
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/52">
                    This week
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{stats.completedThisWeek}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/52">
                    Streak
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.streakDays === 0 ? "0" : stats.streakDays}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={stats.continueWatching.href}
                  className="inline-flex min-h-12 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  Resume lesson
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/14 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Browse missions
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2
                className="mt-3 text-3xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your dashboard is ready for the first mission.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                Start one course and this space will begin tracking mastery, streaks, and what to
                open next.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "AI concepts", value: `${aiMastery}%` },
                  { label: "Coding skills", value: `${codingMastery}%` },
                  { label: "Maths fluency", value: `${mathMastery}%` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/52">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  Explore courses
                </Link>
              </div>
            </>
          )}
        </article>

        <div className="space-y-6">
          <article className="glass-shell rounded-[2.2rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Daily quest
            </p>
            <p
              className="mt-2 text-2xl font-semibold text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Reach {dailyGoalMinutes} focus minutes today
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Estimated from lesson completion, recent watch progress, and streak momentum.
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0b1f4d_0%,#0f2356_42%,#22c55e_100%)] transition-all"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {todayProgressEstimate} / {dailyGoalMinutes} min
            </p>
          </article>

          <article className="glass-shell rounded-[2.2rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Badge shelf
            </p>
            <div className="mt-4 grid gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-[1.25rem] border px-4 py-3 ${badge.toneClass}`}
                >
                  <p className="text-sm font-semibold">{badge.label}</p>
                  <p className="mt-1 text-xs">{badge.description}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="glass-shell rounded-[2.35rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Mastery map
            </p>
            <h2
              className="mt-2 text-2xl font-semibold text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI, coding, and maths stay visible in one learner view.
            </h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Live growth view
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "AI concepts",
              value: aiMastery,
              barClass: "from-emerald-300 via-lime-200 to-emerald-100",
              panelClass: "border-emerald-100 bg-emerald-50/88",
            },
            {
              label: "Coding skills",
              value: codingMastery,
              barClass: "from-sky-300 via-cyan-200 to-blue-100",
              panelClass: "border-sky-100 bg-sky-50/88",
            },
            {
              label: "Math skills",
              value: mathMastery,
              barClass: "from-amber-300 via-yellow-200 to-amber-100",
              panelClass: "border-amber-100 bg-amber-50/88",
            },
          ].map((metric) => (
            <article
              key={metric.label}
              className={`rounded-[1.6rem] border p-5 ${metric.panelClass}`}
            >
              <p className="text-sm font-semibold text-slate-800">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{metric.value}%</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${metric.barClass}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.14fr_0.86fr]">
        <article className="glass-shell rounded-[2.35rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Next mission recommendation
          </p>
          <h2
            className="mt-2 text-3xl font-semibold text-slate-950"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {nextMission.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{nextMission.reason}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
            {nextMission.ageBand && (
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-900">
                Ages {nextMission.ageBand}
              </span>
            )}
            {nextMission.stage && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-900">
                {nextMission.stage}
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={nextMission.href}
              className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Open next mission
            </Link>
            <Link
              href="/courses"
              className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Browse all missions
            </Link>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="glass-shell rounded-[2.2rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Streak
            </p>
            <p
              className="mt-2 text-2xl font-semibold text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {stats.streakDays === 0
                ? "Start one today"
                : `${stats.streakDays} day${stats.streakDays === 1 ? "" : "s"} in motion`}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {stats.streakDays === 0
                ? "Complete one lesson to begin your streak."
                : "Keep it alive by finishing one more lesson today."}
            </p>
          </article>

          <article className="glass-shell rounded-[2.2rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Completed
            </p>
            <p
              className="mt-2 text-2xl font-semibold text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {stats.completedTotal} lesson{stats.completedTotal === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {stats.completedThisWeek} completed this week.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
