import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";
import DashboardStatsClient from "./client/DashboardStatsClient";

const dashboardAuthTimeoutMs = 2_000;

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key?.endsWith("..."));
}

async function getAuthResultWithTimeout() {
  return Promise.race([
    auth(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), dashboardAuthTimeoutMs)),
  ]);
}

export default async function DashboardPage() {
  const clerkOn = isClerkConfigured();
  const authResult = clerkOn ? await getAuthResultWithTimeout() : null;
  const userId = authResult?.userId ?? null;

  if (process.env.DEBUG_CACHE === "1") {
    console.log(`[dashboard] clerkOn=${clerkOn} user=${userId ?? "none"}`);
  }

  if (clerkOn && authResult && !userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_14%_12%,rgba(252,211,77,0.24),transparent_20%),radial-gradient(circle_at_84%_8%,rgba(125,211,252,0.2),transparent_22%),linear-gradient(180deg,#091a41_0%,#112b60_36%,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[34rem] grid-orbit opacity-30" />

      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-8 md:px-8">
        <header className="mb-8 rounded-[2.6rem] border border-white/10 bg-[linear-gradient(145deg,#07142d_0%,#0f2356_32%,#14346f_62%,#0b1f4d_100%)] px-6 py-8 text-white shadow-skyline md:px-10 md:py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
            Learner dashboard
          </p>
          <h1
            className="mt-3 text-4xl font-semibold leading-tight md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back, explorer.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            Your progress, streaks, next mission, and mastery map now live in one faster learner
            cockpit instead of separate light-weight widgets.
          </p>
        </header>

        <DashboardStatsClient />
      </main>
    </div>
  );
}
