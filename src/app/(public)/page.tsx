import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";

export const revalidate = 120;

export default function HomePage() {
  const agePaths = [
    {
      id: "age-5-7",
      label: "Ages 5-7",
      title: "Explorer Path",
      body: "Visual lessons, pattern games, and block coding starters.",
      href: "/courses#age-5-7",
      accent: "from-amber-200/70 to-orange-200/70",
    },
    {
      id: "age-8-10",
      label: "Ages 8-10",
      title: "Builder Path",
      body: "Robot missions with loops, variables, and math puzzles.",
      href: "/courses#age-8-10",
      accent: "from-sky-200/70 to-cyan-200/70",
    },
    {
      id: "age-11-14",
      label: "Ages 11-14",
      title: "Creator Path",
      body: "Safe chatbot projects with Python and data thinking.",
      href: "/courses#age-11-14",
      accent: "from-lime-200/70 to-emerald-200/70",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-lime-50 to-cyan-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-80 w-80 rounded-full bg-cyan-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[28rem] h-64 w-64 -translate-x-1/2 rounded-full bg-lime-200/60 blur-3xl" />
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-lime-200/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lime-900">
              <span className="h-2 w-2 rounded-full bg-lime-600" />
              AI + Code + Math School
            </p>
            <h1
              className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Build the future with AI, code, and mathematics.
            </h1>
            <p className="max-w-xl text-lg text-slate-700">
              Mission-based learning for young kids with short sessions:
              <span className="font-semibold text-slate-900"> learn </span>
              <span className="text-slate-500">→</span>
              <span className="font-semibold text-slate-900"> build </span>
              <span className="text-slate-500">→</span>
              <span className="font-semibold text-slate-900"> share</span>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="rounded-full bg-lime-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-700"
              >
                Choose a mission
              </Link>
              <Link
                href="/teach"
                className="rounded-full border border-lime-200 bg-white px-6 py-3 text-sm font-semibold text-lime-900 transition hover:border-lime-300"
              >
                Teacher workspace
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="rounded-full bg-white/80 px-3 py-1">
                10-15 minute lessons
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Block-to-Python bridge
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Parent and teacher dashboards
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-8 -top-6 h-28 w-28 rounded-full bg-cyan-200/70 blur-2xl" />
            <div className="absolute -right-6 top-8 h-24 w-24 rounded-full bg-lime-200/70 blur-2xl" />
            <div className="rounded-[2.25rem] border border-white/70 bg-white/80 p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    Today&apos;s mission
                  </p>
                  <p className="text-2xl font-semibold">
                    Train a Robot Classifier
                  </p>
                  <p className="text-xs text-slate-300">
                    Use patterns, rules, and counting to improve accuracy.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl bg-lime-100 px-4 py-4">
                    <p className="text-sm font-semibold text-lime-900">
                      Session 2/3 complete
                    </p>
                    <p className="text-xs text-lime-800">
                      Next step: build your own sorting rule.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-100 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Safe AI helper
                    </p>
                    <p className="text-xs text-slate-600">
                      Guided prompts only, built for young learners.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Mastery tracking
                    </p>
                    <p className="text-xs text-amber-800">
                      AI, coding, and math progress in one map.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-16">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">
              Age Paths
            </p>
            <h2
              className="text-2xl font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Start at the right level.
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {agePaths.map((path) => (
              <Link
                key={path.id}
                href={path.href}
                className="group rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg transition hover:-translate-y-1"
              >
                <div
                  className={`mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br ${path.accent}`}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {path.label}
                </p>
                <h3
                  className="mt-1 text-lg font-semibold text-slate-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {path.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{path.body}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-lime-700 transition group-hover:text-lime-800">
                  Open path →
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Learn",
              body: "Short guided lessons with visual explainers and read-aloud support.",
              color: "from-amber-200/70 to-orange-200/70",
            },
            {
              title: "Build",
              body: "Every class ends with a small AI project connected to coding and math.",
              color: "from-cyan-200/70 to-sky-200/70",
            },
            {
              title: "Share",
              body: "Kids present what they made and reflect on what improved.",
              color: "from-lime-200/70 to-emerald-200/70",
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
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime-600">
                Family + teacher ready
              </p>
              <h2
                className="text-2xl font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Track mastery across all three core skills.
              </h2>
              <p className="max-w-xl text-sm text-slate-600">
                Dashboard views highlight AI understanding, coding skill, and
                math confidence so adults know where help is needed.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-lime-100 px-3 py-2">
                AI concept mastery
              </span>
              <span className="rounded-full bg-cyan-100 px-3 py-2">
                Coding milestones
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-2">
                Math growth checks
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
