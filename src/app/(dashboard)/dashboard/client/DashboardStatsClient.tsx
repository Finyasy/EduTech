"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    </div>
  );
}
