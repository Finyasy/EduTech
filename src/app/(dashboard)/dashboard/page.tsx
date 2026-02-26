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
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), dashboardAuthTimeoutMs),
    ),
  ]);
}

export default async function DashboardPage() {
  const clerkOn = isClerkConfigured();
  const authResult = clerkOn ? await getAuthResultWithTimeout() : null;
  const userId = authResult?.userId ?? null;

  if (process.env.DEBUG_CACHE === "1") {
    console.log(
      `[dashboard] clerkOn=${clerkOn} user=${userId ?? "none"}`,
    );
  }

  if (clerkOn && authResult && !userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`);
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader withAuth={false} />
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            Student dashboard
          </p>
          <h1
            className="text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back, explorer.
          </h1>
          <p className="max-w-2xl text-slate-700">
            Track your progress, keep your streak alive, and monitor mastery in
            AI, coding, and mathematics.
          </p>
        </header>
        <DashboardStatsClient />
      </main>
    </div>
  );
}
