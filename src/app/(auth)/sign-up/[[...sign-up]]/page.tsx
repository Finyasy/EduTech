import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPublishableKey &&
  clerkPublishableKey.startsWith("pk_") &&
  !clerkPublishableKey.endsWith("...");

export default async function SignUpPage() {
  if (isClerkConfigured) {
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
  }

  if (!isClerkConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
        <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-100/70 p-6 text-center text-sm text-amber-900">
          Auth is off. Add Clerk keys to{" "}
          <code className="rounded bg-amber-200/70 px-1">.env</code> —{" "}
          <a
            href="https://dashboard.clerk.com/last-active?path=api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            Get keys
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 px-6">
      <SignUp />
    </div>
  );
}
