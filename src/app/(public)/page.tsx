import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-sky-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full bg-orange-200/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-900">
              Learning that feels like play
            </p>
            <h1
              className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Help kids master math and logic through stories, videos, and games.
            </h1>
            <p className="max-w-xl text-lg text-slate-700">
              EduTech blends curated YouTube lessons, quick quizzes, and bite-size
              mini-games so students stay motivated and parents see progress fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Explore courses
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-orange-200 bg-white px-6 py-3 text-sm font-semibold text-orange-900 transition hover:border-orange-300"
              >
                View dashboard
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="rounded-full bg-white/70 px-3 py-1">
                10-minute lessons
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1">
                Game-based mastery
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1">
                Teacher-ready progress
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-sky-200/70 blur-2xl" />
            <div className="absolute -right-4 top-12 h-24 w-24 rounded-full bg-orange-200/70 blur-2xl" />
            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl">
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-900 px-4 py-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    Today
                  </p>
                  <p className="text-2xl font-semibold">
                    Logic Quest: Level 3
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl bg-amber-100 px-4 py-4">
                    <p className="text-sm font-semibold text-amber-900">
                      82% complete
                    </p>
                    <p className="text-xs text-amber-800">
                      Keep watching to unlock the quiz.
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
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
