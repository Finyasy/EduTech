import Link from "next/link";
import { redirect } from "next/navigation";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import LearnerPageHeader from "@/components/shared/LearnerPageHeader";
import SiteHeader from "@/components/shared/SiteHeader";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import { getAuthStateWithTimeout } from "@/lib/server/auth";
import { listGames } from "@/lib/server/data";
import type { GameOverview } from "@/lib/server/data";

const gamesAuthTimeoutMs = 900;

export default async function GamesPage() {
  const authState = await getAuthStateWithTimeout(gamesAuthTimeoutMs);
  if (authState.status === "unauthenticated") {
    redirect(buildSignInRedirectUrl("/games"));
  }

  const games: GameOverview[] = await listGames();
  const showDelayedDataBadge = games.some((game) => game.isFallbackData);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-8 md:px-8">
        <div className="mb-8">
          <LearnerPageHeader
            eyebrow="Learner games"
            title="Choose a game and practice fast."
            description="Each mini-game is a short repetition loop for AI, coding, and maths ideas. Open one, answer quickly, and return to your learning flow."
            badges={
              showDelayedDataBadge ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900">
                  Data may be delayed
                </span>
              ) : undefined
            }
          />
        </div>

        {authState.status === "timed_out" && (
          <div className="mb-6">
            <LearnerRouteAuthBridge
              redirectUrl="/games"
              eyebrow="Learner session"
              title="Checking your games access."
              description="The games library is ready. If you are signed out, we will send you into the refreshed sign-in flow and then return you here."
            />
          </div>
        )}

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
