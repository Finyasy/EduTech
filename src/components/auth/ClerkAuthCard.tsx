"use client";

import { useEffect, useMemo } from "react";
import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { normalizeAppRedirectPath } from "@/lib/auth/post-auth-routing";

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

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "w-full rounded-[1.8rem] border-0 bg-transparent p-0 shadow-none",
    headerTitle:
      "text-[2rem] font-semibold tracking-[-0.03em] text-slate-950",
    headerSubtitle: "text-sm leading-7 text-slate-600",
    socialButtonsBlock:
      "gap-3 border-b border-slate-200/80 pb-5",
    socialButtonsBlockButton:
      "min-h-11 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:bg-slate-50",
    socialButtonsBlockButtonText: "text-sm font-medium",
    dividerLine: "bg-slate-200",
    dividerText:
      "bg-transparent px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400",
    formFieldLabel:
      "mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",
    formButtonPrimary:
      "mt-2 min-h-12 rounded-2xl bg-slate-950 text-sm font-semibold shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:bg-slate-800",
    formFieldInput:
      "min-h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 shadow-none transition focus-visible:ring-2 focus-visible:ring-sky-200",
    formFieldInputShowPasswordButton:
      "text-slate-500 hover:text-slate-700",
    formFieldAction: "font-semibold text-sky-700 hover:text-sky-800",
    footer: "border-t border-slate-200/80 pt-5",
    footerActionText: "text-sm text-slate-600",
    footerActionLink: "font-semibold text-orange-700 hover:text-orange-800",
    identityPreviewText: "text-sm text-slate-700",
    identityPreviewEditButton:
      "font-semibold text-sky-700 hover:text-sky-800",
    alert:
      "rounded-2xl border border-amber-200 bg-amber-50 text-amber-900",
    alertText: "text-sm text-amber-900",
    otpCodeFieldInput:
      "h-12 w-12 rounded-2xl border border-slate-200 text-slate-950 shadow-none focus-visible:ring-2 focus-visible:ring-sky-200",
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
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(() => {
    const requestedPath = normalizeAppRedirectPath(searchParams.get("redirect_url"));
    return requestedPath ?? "/post-auth";
  }, [searchParams]);

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
            forceRedirectUrl={redirectTarget}
            fallbackRedirectUrl={redirectTarget}
            signUpFallbackRedirectUrl={redirectTarget}
            appearance={clerkAppearance}
          />
        ) : (
          <SignUp
            forceRedirectUrl={redirectTarget}
            fallbackRedirectUrl={redirectTarget}
            signInFallbackRedirectUrl={redirectTarget}
            appearance={clerkAppearance}
          />
        )}
      </ClerkLoaded>
    </>
  );
}
