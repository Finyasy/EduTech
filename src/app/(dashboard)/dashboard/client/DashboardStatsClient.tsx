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
const statsRequestTimeoutMs = 2_500;
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
          router.replace(
            `/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`,
          );
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to load dashboard stats.");
        }
        const data = (await response.json()) as DashboardStats;
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
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
      <section className="grid gap-6 md:grid-cols-3">
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

      <section className="rounded-3xl border border-lime-100 bg-white/85 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Mastery map
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Progress across the three core pillars: AI understanding, coding
          fluency, and mathematics confidence.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { label: "AI concepts", value: aiMastery, tone: "bg-lime-500" },
            { label: "Coding skills", value: codingMastery, tone: "bg-cyan-500" },
            { label: "Math skills", value: mathMastery, tone: "bg-amber-500" },
          ].map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-800">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {metric.value}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${metric.tone}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Next mission recommendation
          </p>
          <h2
            className="mt-2 text-2xl font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {nextMission.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{nextMission.reason}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={nextMission.href}
              className="inline-flex min-h-11 items-center rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700"
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

        <div className="space-y-6">
          <article className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Daily quest
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              Reach {dailyGoalMinutes} focus minutes today
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Estimated progress from your recent activity and lesson completion.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {todayProgressEstimate} / {dailyGoalMinutes} min
            </p>
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Badge shelf
            </p>
            <div className="mt-3 grid gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl border px-4 py-3 ${badge.toneClass}`}
                >
                  <p className="text-sm font-semibold">{badge.label}</p>
                  <p className="mt-1 text-xs">{badge.description}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
