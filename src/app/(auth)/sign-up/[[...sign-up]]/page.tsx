import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClerkAuthCard from "@/components/auth/ClerkAuthCard";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";
import { normalizeAppRedirectPath } from "@/lib/auth/post-auth-routing";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPublishableKey &&
  clerkPublishableKey.startsWith("pk_") &&
  !clerkPublishableKey.endsWith("...");

type SignUpPageProps = {
  searchParams?: Promise<{ redirect_url?: string | string[] }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectUrlValue = resolvedSearchParams?.redirect_url;
  const requestedPath = normalizeAppRedirectPath(
    Array.isArray(redirectUrlValue) ? redirectUrlValue[0] : redirectUrlValue,
  );
  const alternateHref = requestedPath
    ? `/sign-in?redirect_url=${encodeURIComponent(requestedPath)}`
    : "/sign-in";

  if (isClerkConfigured) {
    const { userId } = await auth();
    if (userId) {
      redirect(requestedPath ?? "/post-auth");
    }
  }

  if (!isClerkConfigured) {
    return (
      <AuthExperienceShell
        mode="sign-up"
        eyebrow="Learner onboarding"
        title="Create a learner account that feels guided."
        description="Families, learners, and teachers should land in a calm setup flow before they enter missions, progress, and classroom support."
        alternateHref={alternateHref}
      >
        <div className="space-y-5 rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-950">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              Auth setup required
            </p>
            <p className="leading-7 text-amber-900/80">
              Sign-up is off until valid Clerk keys are added to{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[13px]">
                .env
              </code>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://dashboard.clerk.com/last-active?path=api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Get Clerk keys
            </a>
          </div>
        </div>
      </AuthExperienceShell>
    );
  }

  return (
    <AuthExperienceShell
      mode="sign-up"
      eyebrow="Learner onboarding"
      title="Create an account and start the next mission."
      description="Set up a learner profile, step into structured AI, maths, and coding pathways, and keep progress visible for home and school."
      alternateHref={alternateHref}
    >
      <div className="mx-auto w-full max-w-lg">
        <ClerkAuthCard mode="sign-up" />
      </div>
    </AuthExperienceShell>
  );
}
