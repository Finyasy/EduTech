import Link from "next/link";
import type { ReactNode } from "react";

type AuthExperienceShellProps = {
  mode: "sign-in" | "sign-up";
  title: string;
  description: string;
  eyebrow: string;
  alternateHref?: string;
  children: ReactNode;
};

const missionSignals = [
  {
    label: "Mission-first learning",
    body: "AI, coding, and maths stay connected in one calm learner flow.",
  },
  {
    label: "Visible progress",
    body: "Learners and families can see what was started, finished, and mastered.",
  },
  {
    label: "Teacher alignment",
    body: "The learner library and teaching workspace stay connected to the same missions.",
  },
];

export default function AuthExperienceShell({
  mode,
  title,
  description,
  eyebrow,
  alternateHref,
  children,
}: AuthExperienceShellProps) {
  const isSignIn = mode === "sign-in";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[38rem] grid-orbit opacity-35" />

      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="rounded-[2.75rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] px-6 py-8 text-white shadow-skyline md:px-10 md:py-12">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#fde68a_38%,#a7f3d0_72%,#bae6fd_100%)] text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_20px_rgba(15,23,42,0.12)]">
                  LB
                </span>
                LearnBridge
              </Link>
              <Link
                href={alternateHref ?? (isSignIn ? "/sign-up" : "/sign-in")}
                className="text-sm font-semibold text-white/74 transition hover:text-white"
              >
                {isSignIn ? "Need an account?" : "Already registered?"}
              </Link>
            </div>

            <div className="mt-10 max-w-2xl space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">
                {eyebrow}
              </p>
              <h1
                className="text-4xl font-semibold leading-[1.04] md:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {description}
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {missionSignals.map((signal) => (
                <article
                  key={signal.label}
                  className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                    {signal.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/72">{signal.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Link
                href="/courses"
                className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/12"
              >
                Browse learner missions
              </Link>
              <Link
                href="/teach"
                className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/12"
              >
                Open teacher workspace
              </Link>
            </div>
          </section>

          <section className="glass-shell rounded-[2.4rem] border border-white/70 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.12)] md:p-6">
            <div className="rounded-[2rem] border border-white/80 bg-white/78 p-4 md:p-5">
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
