import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-sky-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-80 w-80 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[28rem] h-64 w-64 -translate-x-1/2 rounded-full bg-rose-200/60 blur-3xl" />
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-200/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-900">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Learning that feels like play
            </p>
            <h1
              className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LearnBridge turns math and logic into colorful adventures.
            </h1>
            <p className="max-w-xl text-lg text-slate-700">
              Short videos, quest-style quizzes, and mini-games keep kids moving
              forward while parents track every milestone.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Start a quest
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-orange-200 bg-white px-6 py-3 text-sm font-semibold text-orange-900 transition hover:border-orange-300"
              >
                View dashboard
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="rounded-full bg-white/80 px-3 py-1">
                8-12 minute lessons
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Reward badges
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Progress map
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-8 -top-6 h-28 w-28 rounded-full bg-sky-200/70 blur-2xl" />
            <div className="absolute -right-6 top-8 h-24 w-24 rounded-full bg-orange-200/70 blur-2xl" />
            <div className="rounded-[2.25rem] border border-white/70 bg-white/80 p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    Today’s adventure
                  </p>
                  <p className="text-2xl font-semibold">
                    Logic Quest: Level 3
                  </p>
                  <p className="text-xs text-slate-300">
                    Collect 3 stars to unlock the bonus game.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl bg-amber-100 px-4 py-4">
                    <p className="text-sm font-semibold text-amber-900">
                      82% complete
                    </p>
                    <p className="text-xs text-amber-800">
                      Two steps left to earn a badge.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Next up: Patterns & Shapes
                    </p>
                    <p className="text-xs text-slate-600">
                      9 minutes · video lesson
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4">
                    <p className="text-sm font-semibold text-sky-900">
                      New reward unlocked
                    </p>
                    <p className="text-xs text-sky-800">
                      Rocket backpack for your avatar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Story quests",
              body: "Kids follow animated stories that turn lessons into missions.",
              color: "from-orange-200/70 to-rose-200/70",
            },
            {
              title: "Brain games",
              body: "Quick challenges build speed and confidence with every try.",
              color: "from-sky-200/70 to-emerald-200/70",
            },
            {
              title: "Progress map",
              body: "A colorful trail shows exactly what they’ve mastered.",
              color: "from-amber-200/70 to-lime-200/70",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg"
            >
              <div
                className={`mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br ${card.color}`}
              />
              <h3
                className="text-lg font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{card.body}</p>
            </div>
          ))}
        </section>
        <section className="mt-12 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                Parent-ready
              </p>
              <h2
                className="text-2xl font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                See what’s clicking, right away.
              </h2>
              <p className="max-w-xl text-sm text-slate-600">
                LearnBridge shares clear progress snapshots, streaks, and
                encouragement tips so families stay in sync.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-amber-100 px-3 py-2">
                Weekly recaps
              </span>
              <span className="rounded-full bg-sky-100 px-3 py-2">
                Skill mastery
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-2">
                Goal streaks
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
