import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import LearnerPageHeader from "@/components/shared/LearnerPageHeader";
import SiteHeader from "@/components/shared/SiteHeader";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import { FIRST_MATH_VERTICAL_SLICE } from "@/lib/curriculum/math-roadmap";
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
  const isPp1CountingGame = gameId === FIRST_MATH_VERTICAL_SLICE.gameId;

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
      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-8 md:px-8">
        <div className="mb-8">
          <LearnerPageHeader
            eyebrow={isPp1CountingGame ? "PP1 maths practice" : "Game detail"}
            title={data.game.title}
            description={
              isPp1CountingGame
                ? "Count the objects. Choose the matching number. Try again if you missed one."
                : data.game.description
            }
            badges={
              <>
                {isPp1CountingGame ? (
                  <>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                      PP1 Term 2 Week 1
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-900">
                      Counting 5-9
                    </span>
                  </>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                    Fast practice
                  </span>
                )}
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {data.levels.length} set{data.levels.length === 1 ? "" : "s"}
                </span>
              </>
            }
            actions={
              <div className="flex flex-wrap gap-2">
                {isPp1CountingGame && (
                  <Link
                    href="/courses/course-math#pp1-week-1"
                    className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                  >
                    Maths roadmap
                  </Link>
                )}
                {!isPp1CountingGame && (
                  <Link
                    href="/games"
                    className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    Games
                  </Link>
                )}
              </div>
            }
          >
            {isPp1CountingGame && (
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { label: "Roadmap slice", value: "PP1 Term 2 Week 1" },
                  { label: "Focus", value: "Counting 5-9" },
                  { label: "Practice", value: "5 sets to try" },
                  { label: "Next step", value: "Return to the same roadmap slice" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </LearnerPageHeader>
        </div>

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
