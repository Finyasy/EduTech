import { redirect } from "next/navigation";
import LearnerRouteAuthBridge from "@/components/auth/LearnerRouteAuthBridge";
import LearnerPageHeader from "@/components/shared/LearnerPageHeader";
import SiteHeader from "@/components/shared/SiteHeader";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";
import { getAuthStateWithTimeout } from "@/lib/server/auth";
import DashboardStatsClient from "./client/DashboardStatsClient";

const dashboardAuthTimeoutMs = 900;

export default async function DashboardPage() {
  const authState = await getAuthStateWithTimeout(dashboardAuthTimeoutMs);
  const userId = authState.status === "authenticated" ? authState.userId : null;

  if (process.env.DEBUG_CACHE === "1") {
    console.log(`[dashboard] auth=${authState.status} user=${userId ?? "none"}`);
  }

  if (authState.status === "unauthenticated") {
    redirect(buildSignInRedirectUrl("/dashboard"));
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader withAuth={false} />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-8 md:px-8">
        <div className="mb-8">
          <LearnerPageHeader
            eyebrow="Learner dashboard"
            title="Welcome back, explorer."
            description="Your progress, streaks, next mission, and mastery map now live in one faster learner cockpit instead of separate light-weight widgets."
          />
        </div>

        {authState.status === "timed_out" && (
          <div className="mb-6">
            <LearnerRouteAuthBridge
              redirectUrl="/dashboard"
              eyebrow="Learner session"
              title="Checking your learner dashboard access."
              description="The dashboard shell is ready. If your session expired, we will move you into the new sign-in flow without leaving you on a blank page."
            />
          </div>
        )}

        <DashboardStatsClient />
      </main>
    </div>
  );
}
