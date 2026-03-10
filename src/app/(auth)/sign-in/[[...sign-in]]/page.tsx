import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClerkAuthCard from "@/components/auth/ClerkAuthCard";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPublishableKey &&
  clerkPublishableKey.startsWith("pk_") &&
  !clerkPublishableKey.endsWith("...");

export default async function SignInPage() {
  if (isClerkConfigured) {
    const { userId } = await auth();
    if (userId) {
      redirect("/post-auth");
    }
  }

  if (!isClerkConfigured) {
    return (
      <AuthExperienceShell
        mode="sign-in"
        eyebrow="Learner access"
        title="Sign in to resume your missions."
        description="LearnBridge keeps AI, maths, and coding in one learner flow. Add live Clerk keys to unlock secure sign-in for learners, teachers, and admins."
      >
        <div className="space-y-5 rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-950">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              Auth setup required
            </p>
            <p className="text-sm leading-7 text-amber-900/80">
              Sign-in is unavailable until valid Clerk keys are added to{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[13px]">
                .env
              </code>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse learner missions
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center rounded-full border border-amber-300 px-5 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </AuthExperienceShell>
    );
  }

  return (
    <AuthExperienceShell
      mode="sign-in"
      eyebrow="Learner access"
      title="Sign in to resume your missions."
      description="Return to your learner workspace, continue course streaks, and step back into AI, maths, and coding from the same place."
    >
      <div className="mx-auto w-full max-w-lg">
        <ClerkAuthCard mode="sign-in" />
      </div>
    </AuthExperienceShell>
  );
}
