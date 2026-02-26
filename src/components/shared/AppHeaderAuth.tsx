"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

type AppHeaderAuthProps = {
  clerkEnabled: boolean;
};

export default function AppHeaderAuth({ clerkEnabled }: AppHeaderAuthProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkEnabled) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-amber-50"
      >
        Sign in
      </Link>
    );
  }

  if (!publishableKey) {
    return null;
  }

  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-amber-50"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-amber-50"
            >
              Sign up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
