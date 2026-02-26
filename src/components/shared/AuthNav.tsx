"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

type AuthNavProps = {
  isStaff?: boolean;
  isAdmin?: boolean;
};

const fallbackRedirectUrl = "/post-auth";

export default function AuthNav({ isStaff, isAdmin }: AuthNavProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const disableSocial = process.env.NEXT_PUBLIC_CLERK_DISABLE_SOCIAL === "1";
  if (!publishableKey) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <div className="flex items-center gap-2">
          {disableSocial ? (
            <>
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <SignInButton
                mode="modal"
                fallbackRedirectUrl={fallbackRedirectUrl}
                signUpFallbackRedirectUrl={fallbackRedirectUrl}
              >
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton
                mode="modal"
                fallbackRedirectUrl={fallbackRedirectUrl}
                signInFallbackRedirectUrl={fallbackRedirectUrl}
              >
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Sign up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </SignedOut>
      <SignedIn>
        {isStaff && (
          <Link
            href="/teach"
            className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/70"
          >
            Teach
          </Link>
        )}
        <Link
          href="/profile"
          className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/70"
        >
          Profile
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/70"
          >
            Staff
          </Link>
        )}
        <UserButton
          afterSignOutUrl="/"
          userProfileMode="navigation"
          userProfileUrl="/profile"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
