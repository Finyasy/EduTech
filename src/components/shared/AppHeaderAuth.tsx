"use client";

import Link from "next/link";
import {
  ClerkProvider,
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
        className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-amber-50"
      >
        Sign in
      </Link>
    );
  }

  if (!publishableKey) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </ClerkProvider>
  );
}
