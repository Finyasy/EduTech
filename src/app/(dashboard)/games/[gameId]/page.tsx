import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import SiteHeader from "@/components/shared/SiteHeader";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import { getAuthStateWithTimeout } from "@/lib/server/auth";
import { getGameWithLevels } from "@/lib/server/data";
import GamePlay from "./client/GamePlay";

type GamePageProps = {
  params: Promise<{ gameId: string }>;
};

const gameDetailAuthTimeoutMs = 900;

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const data = await getGameWithLevels(gameId);

  const authState = await getAuthStateWithTimeout(gameDetailAuthTimeoutMs);
  if (authState.status === "unauthenticated") {
    redirect(buildSignInRedirectUrl(`/games/${gameId}`));
  }

  if (!data) {
    notFound();
  }

  if (data.levels.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_82%)]" />
        <SiteHeader withAuth={false} />
        <main className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8 md:px-8">
          <Link
            href="/games"
            className="inline-flex min-h-11 items-center rounded-full border border-white/70 bg-white/78 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-200 hover:text-slate-950"
          >
            ← Games
          </Link>
          <div className="mt-8 glass-shell rounded-[2.2rem] border border-white/70 p-6 text-slate-600 shadow-[0_20px_56px_rgba(15,23,42,0.08)]">
            No levels in this game yet. Check back soon.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[32rem] grid-orbit opacity-30" />

      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-8 md:px-8">
        <header className="mb-8 rounded-[2.6rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] px-6 py-8 text-white shadow-skyline md:px-10 md:py-10">
          <Link
            href="/games"
            className="inline-flex min-h-11 items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            ← Games
          </Link>
          <h1
            className="mt-4 text-4xl font-semibold leading-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {data.game.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            {data.game.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68">
              {data.levels.length} level{data.levels.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68">
              Fast practice
            </span>
          </div>
        </header>

        {authState.status === "timed_out" && (
          <div className="mb-6">
            <LearnerRouteAuthBridge
              redirectUrl={`/games/${gameId}`}
              eyebrow="Learner session"
              title="Checking your game session."
              description="The game board is loaded. If your session expired, we will move you into sign-in and bring you straight back to this game."
            />
          </div>
        )}

        <GamePlay
          gameId={gameId}
          levels={data.levels}
          clerkEnabled={authState.status !== "disabled"}
        />
      </main>
    </div>
  );
}
