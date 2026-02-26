import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClerkAuthCard from "@/components/auth/ClerkAuthCard";

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
      <div className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
        <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-100/70 p-6 text-center text-sm text-amber-900">
          <p className="mb-4">Sign-in is not available until Clerk keys are added to .env.</p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-300"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
      <div className="w-full max-w-md">
        <ClerkAuthCard mode="sign-in" />
      </div>
    </div>
  );
}
