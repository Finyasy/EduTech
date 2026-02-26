"use client";

import { useEffect } from "react";
import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";

type ClerkAuthCardProps = {
  mode: "sign-in" | "sign-up";
};

const applyAutocompleteHints = (mode: ClerkAuthCardProps["mode"]) => {
  const inputs = document.querySelectorAll<HTMLInputElement>("input");
  inputs.forEach((input) => {
    if (input.autocomplete) {
      return;
    }

    const metadata = `${input.type} ${input.name ?? ""} ${input.id ?? ""} ${
      input.getAttribute("aria-label") ?? ""
    } ${input.placeholder ?? ""}`.toLowerCase();

    if (input.type === "password") {
      input.autocomplete = mode === "sign-in" ? "current-password" : "new-password";
      return;
    }

    if (input.type === "email" || metadata.includes("email")) {
      input.autocomplete = "email";
      return;
    }

    if (metadata.includes("first")) {
      input.autocomplete = "given-name";
      return;
    }

    if (metadata.includes("last")) {
      input.autocomplete = "family-name";
      return;
    }

    if (metadata.includes("verification") || metadata.includes("code")) {
      input.autocomplete = "one-time-code";
    }
  });
};

const disableSocial =
  process.env.NEXT_PUBLIC_CLERK_DISABLE_SOCIAL === "1";
const fallbackRedirectUrl = "/post-auth";

const clerkAppearance = {
  elements: {
    card: "rounded-3xl border border-white/70 bg-white/90 shadow-xl",
    socialButtonsBlockButton:
      "min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formButtonPrimary:
      "min-h-11 rounded-xl bg-slate-800 text-sm font-semibold hover:bg-slate-900",
    formFieldInput:
      "min-h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-none focus-visible:ring-2 focus-visible:ring-orange-300",
    footerActionLink: "font-semibold text-orange-700 hover:text-orange-800",
    ...(disableSocial
      ? {
          socialButtonsBlock: "hidden",
          socialButtonsBlockButton: "hidden",
          socialButtonsBlockButtonText: "hidden",
        }
      : null),
  },
} as const;

function AuthLoadingCard() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl">
      <div className="animate-pulse space-y-4">
        <div className="mx-auto h-7 w-44 rounded bg-slate-200" />
        <div className="mx-auto h-4 w-56 rounded bg-slate-100" />
        <div className="h-11 rounded-xl bg-slate-100" />
        <div className="h-11 rounded-xl bg-slate-100" />
        <div className="h-11 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function ClerkAuthCard({ mode }: ClerkAuthCardProps) {
  useEffect(() => {
    applyAutocompleteHints(mode);
    const observer = new MutationObserver(() => applyAutocompleteHints(mode));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [mode]);

  return (
    <>
      <ClerkLoading>
        <AuthLoadingCard />
      </ClerkLoading>
      <ClerkLoaded>
        {mode === "sign-in" ? (
          <SignIn
            forceRedirectUrl={fallbackRedirectUrl}
            fallbackRedirectUrl={fallbackRedirectUrl}
            signUpFallbackRedirectUrl={fallbackRedirectUrl}
            appearance={clerkAppearance}
          />
        ) : (
          <SignUp
            forceRedirectUrl={fallbackRedirectUrl}
            fallbackRedirectUrl={fallbackRedirectUrl}
            signInFallbackRedirectUrl={fallbackRedirectUrl}
            appearance={clerkAppearance}
          />
        )}
      </ClerkLoaded>
    </>
  );
}
