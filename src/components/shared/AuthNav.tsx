"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

type AuthNavProps = {
  isAdmin?: boolean;
};

export default function AuthNav({ isAdmin }: AuthNavProps) {
  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link
          href="/profile"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/70"
        >
          Profile
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/70"
          >
            Admin
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
