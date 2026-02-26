import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { listGames } from "@/lib/server/data";
import type { GameOverview } from "@/lib/server/data";

export default async function GamesPage() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured =
    Boolean(clerkPublishableKey?.startsWith("pk_") && !clerkPublishableKey.endsWith("..."));

  if (isClerkConfigured) {
    const { userId } = await auth();
    if (!userId) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent("/games")}`);
    }
  }

  const games: GameOverview[] = await listGames();
  const showDelayedDataBadge = games.some((game) => game.isFallbackData);

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Mini-games
          </p>
          {showDelayedDataBadge && (
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
              Data may be delayed
            </div>
          )}
          <h1
            className="text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Play to practice.
          </h1>
          <p className="max-w-2xl text-slate-700">
            Each game reinforces a lesson concept with quick puzzles and
            rewards.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          {games.length === 0 ? (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-600">
              No games available yet. Check back soon.
            </div>
          ) : (
            games.map((game) => (
              <article
                key={game.id}
                className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm"
              >
                <h2
                  className="text-2xl font-semibold text-slate-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {game.title}
                </h2>
                <p className="mt-3 text-sm text-slate-600">{game.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {game.levelCount} level{game.levelCount === 1 ? "" : "s"}
                </p>
                <Link
                  href={`/games/${game.id}`}
                  className="mt-4 inline-block rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Play
                </Link>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
