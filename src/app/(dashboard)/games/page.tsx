import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { listGames } from "@/lib/server/data";
import type { GameOverview } from "@/lib/server/data";

export default async function GamesPage() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(
    clerkPublishableKey?.startsWith("pk_") && !clerkPublishableKey.endsWith("..."),
  );

  if (isClerkConfigured) {
    const { userId } = await auth();
    if (!userId) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent("/games")}`);
    }
  }

  const games: GameOverview[] = await listGames();
  const showDelayedDataBadge = games.some((game) => game.isFallbackData);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[34rem] grid-orbit opacity-30" />

      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-8 md:px-8">
        <header className="mb-8 rounded-[2.6rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] px-6 py-8 text-white shadow-skyline md:px-10 md:py-10">
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/62">
              Learner games
            </p>
            {showDelayedDataBadge && (
              <span className="rounded-full border border-amber-200/25 bg-amber-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100">
                Data may be delayed
              </span>
            )}
          </div>
          <h1
            className="mt-4 text-4xl font-semibold leading-tight md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Play to practice without leaving the learning flow.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            Each mini-game is a fast repetition loop for AI, coding, and maths ideas. Open one,
            answer quickly, and keep your learning momentum high.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {games.length === 0 ? (
            <div className="glass-shell rounded-[2.2rem] border border-white/70 p-6 text-slate-600 shadow-[0_20px_56px_rgba(15,23,42,0.08)] md:col-span-2 xl:col-span-3">
              No games available yet. Check back soon.
            </div>
          ) : (
            games.map((game, index) => (
              <article
                key={game.id}
                className="group glass-shell overflow-hidden rounded-[2.2rem] border border-white/70 p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(15,23,42,0.12)]"
              >
                <div
                  className={`mb-5 h-16 w-16 rounded-[1.45rem] bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                    index % 3 === 0
                      ? "from-amber-200 via-orange-200 to-yellow-100"
                      : index % 3 === 1
                        ? "from-sky-200 via-cyan-200 to-blue-100"
                        : "from-lime-200 via-emerald-200 to-teal-100"
                  }`}
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Quick practice loop
                </p>
                <h2
                  className="mt-2 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {game.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{game.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {game.levelCount} level{game.levelCount === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Fast retry
                  </span>
                </div>
                <Link
                  href={`/games/${game.id}`}
                  className="mt-6 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Play game
                </Link>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
