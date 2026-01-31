import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import { getGameWithLevels } from "@/lib/server/data";
import GamePlay from "./client/GamePlay";

type GamePageProps = {
  params: Promise<{ gameId: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const data = await getGameWithLevels(gameId);

  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured =
    Boolean(clerkPublishableKey?.startsWith("pk_") && !clerkPublishableKey.endsWith("..."));

  if (isClerkConfigured) {
    const { userId } = await auth();
    if (!userId) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent(`/games/${gameId}`)}`);
    }
  }

  if (!data) {
    notFound();
  }

  if (data.levels.length === 0) {
    return (
      <div className="min-h-screen bg-amber-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10">
          <Link
            href="/games"
            className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Games
          </Link>
          <div className="mt-8 rounded-3xl border border-white/70 bg-white/80 p-6 text-slate-600">
            No levels in this game yet. Check back soon.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10">
        <header className="mb-8 space-y-2">
          <Link
            href="/games"
            className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Games
          </Link>
          <h1
            className="text-3xl font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {data.game.title}
          </h1>
          <p className="text-slate-600">{data.game.description}</p>
        </header>
        <GamePlay
          gameId={gameId}
          levels={data.levels}
          clerkEnabled={isClerkConfigured}
        />
      </main>
    </div>
  );
}
