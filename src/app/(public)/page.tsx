import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";

export const revalidate = 120;

const agePaths = [
  {
    id: "age-5-7",
    label: "Ages 5-7",
    title: "Explorer Path",
    body: "Pattern play, first AI ideas, and short wins that feel like discovery.",
    href: "/courses#age-5-7",
    accent: "from-amber-200 via-orange-200 to-yellow-100",
  },
  {
    id: "age-8-10",
    label: "Ages 8-10",
    title: "Builder Path",
    body: "Robot missions, loops, game logic, and maths strategy in one flow.",
    href: "/courses#age-8-10",
    accent: "from-sky-200 via-cyan-200 to-blue-100",
  },
  {
    id: "age-11-14",
    label: "Ages 11-14",
    title: "Creator Path",
    body: "AI apps, Python thinking, responsible tech, and real-world projects.",
    href: "/courses#age-11-14",
    accent: "from-lime-200 via-emerald-200 to-teal-100",
  },
];

const proofTiles = [
  {
    value: "3",
    label: "age-banded learning studios",
    detail: "Explorer, Builder, Creator",
  },
  {
    value: "12+",
    label: "mission experiences",
    detail: "AI, coding, maths blended together",
  },
  {
    value: "Learn",
    label: "Build",
    detail: "Share in every mission cycle",
  },
  {
    value: "1",
    label: "teacher cockpit",
    detail: "assign, monitor, intervene",
  },
];

const studioModes = [
  {
    title: "Mission Sprint",
    body: "Short guided practice with visible momentum from the first lesson.",
    tone: "border-amber-200/70 bg-amber-50/90 text-amber-950",
  },
  {
    title: "Build Lab",
    body: "Learners code, test, and improve something tangible instead of only watching.",
    tone: "border-sky-200/70 bg-sky-50/90 text-sky-950",
  },
  {
    title: "App Studio",
    body: "Older learners prototype useful AI tools with evidence and ethics built in.",
    tone: "border-emerald-200/70 bg-emerald-50/90 text-emerald-950",
  },
  {
    title: "Family Visibility",
    body: "Progress feels concrete because adults can see where support is needed.",
    tone: "border-fuchsia-200/70 bg-fuchsia-50/90 text-fuchsia-950",
  },
];

const learnerSignals = [
  {
    label: "Today in the mission library",
    title: "Learners move through one premium flow",
    body: "Start with a concept, build something playful, then explain the result in kid-friendly language.",
  },
  {
    label: "Why it feels different",
    title: "Designed like a studio, not a worksheet site",
    body: "Rich surfaces, clear hierarchy, and fast decisions keep learners moving without visual clutter.",
  },
];

const missionRail = [
  "AI Pattern Detectives",
  "Arcade AI Game Lab",
  "AI App Inventor Studio",
  "Climate Data Code Studio",
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_18%_12%,rgba(252,211,77,0.34),transparent_20%),radial-gradient(circle_at_82%_8%,rgba(125,211,252,0.22),transparent_20%),linear-gradient(180deg,#0b1f4d_0%,#102a63_34%,transparent_76%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-28 h-[36rem] grid-orbit opacity-40" />
      <SiteHeader withAuth={false} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 pb-24 pt-8 md:px-8">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] px-6 py-8 text-white shadow-skyline md:px-10 md:py-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-20 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="absolute right-16 top-12 h-56 w-56 rounded-full bg-cyan-300/16 blur-3xl" />
            <div className="absolute bottom-8 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-300/14 blur-3xl" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/78">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Learner-first digital school
              </div>

              <div className="space-y-4">
                <h1
                  className="max-w-3xl text-5xl font-semibold leading-[1.02] md:text-7xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Build the future with AI, code, and mathematics.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                  A premium learning studio for young learners: fast missions,
                  project energy, and clear proof of growth for teachers and families.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5"
                >
                  Choose a mission
                </Link>
                <Link
                  href="/courses#age-8-10"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/16 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  See the learner library
                </Link>
                <Link
                  href="/teach"
                  className="inline-flex min-h-12 items-center rounded-full border border-cyan-200/30 bg-cyan-300/10 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/16"
                >
                  For teachers
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {proofTiles.map((tile) => (
                  <article
                    key={tile.label}
                    className="rounded-[1.65rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                  >
                    <p className="text-2xl font-semibold text-white">{tile.value}</p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                      {tile.label}
                    </p>
                    <p className="mt-2 text-sm leading-5 text-white/68">{tile.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-8">
              <div className="glass-shell relative overflow-hidden rounded-[2rem] border border-white/12 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.26)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(252,211,77,0.2),rgba(125,211,252,0.16),transparent)]" />
                <div className="relative space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                        Learner mission board
                      </p>
                      <h2
                        className="mt-2 text-2xl font-semibold text-slate-950"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        One clean place to learn, build, and show growth
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-xs font-semibold text-emerald-900">
                      Ready for class
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-slate-200/80 bg-slate-950 px-5 py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.28)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80">
                      Today&apos;s mission
                    </p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold">Train a Robot Classifier</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-white/66">
                          Use patterns, rules, and counting to improve accuracy with visible progress in every step.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/52">
                          Session
                        </p>
                        <p className="mt-1 text-lg font-semibold">2 / 3 complete</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {learnerSignals.map((signal) => (
                      <article
                        key={signal.title}
                        className="rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-4"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {signal.label}
                        </p>
                        <h3
                          className="mt-2 text-lg font-semibold text-slate-950"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {signal.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{signal.body}</p>
                      </article>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {missionRail.map((mission) => (
                      <span
                        key={mission}
                        className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {mission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 right-4 hidden rounded-[1.5rem] border border-white/12 bg-emerald-300/10 px-5 py-4 text-white shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur-md md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/72">
                  Growth model
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Learn → Build → Share</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-6 grid gap-5 lg:grid-cols-3">
          {agePaths.map((path) => (
            <Link
              key={path.id}
              href={path.href}
              className="group glass-shell rounded-[2rem] border border-white/70 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
            >
              <div
                className={`mb-5 h-14 w-14 rounded-[1.35rem] bg-gradient-to-br ${path.accent} shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`}
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {path.label}
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {path.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{path.body}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-slate-950 transition group-hover:translate-x-0.5">
                Open path →
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700">
              Learner experience system
            </p>
            <h2
              className="max-w-xl text-4xl font-semibold leading-tight text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Premium visual rhythm, but grounded in classroom clarity.
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Stripe’s best pattern is not just polish. It is the way every section earns attention,
              proves value, and makes the next decision obvious. LearnBridge now does that for young learners.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {studioModes.map((mode) => (
              <article
                key={mode.title}
                className={`rounded-[1.7rem] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ${mode.tone}`}
              >
                <h3
                  className="text-xl font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {mode.title}
                </h3>
                <p className="mt-3 text-sm leading-6">{mode.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-shell rounded-[2.5rem] border border-white/70 px-6 py-8 shadow-[0_22px_52px_rgba(15,23,42,0.08)] md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-700">
                Adults stay in the loop
              </p>
              <h2
                className="mt-2 text-3xl font-semibold text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Clear signals for teachers, calm progress for families.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                AI concept mastery
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                Coding milestones
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
                Maths growth checks
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
