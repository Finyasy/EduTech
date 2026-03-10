"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";

type LearnerRouteAuthBridgeProps = {
  redirectUrl: string;
  eyebrow: string;
  title: string;
  description: string;
};

export default function LearnerRouteAuthBridge({
  redirectUrl,
  eyebrow,
  title,
  description,
}: LearnerRouteAuthBridgeProps) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const signInHref = buildSignInRedirectUrl(redirectUrl);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace(signInHref);
    }
  }, [isLoaded, router, signInHref, userId]);

  if (isLoaded && userId) {
    return null;
  }

  return (
    <div className="glass-shell rounded-[2.1rem] border border-white/70 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {eyebrow}
      </p>
      <h2
        className="mt-2 text-2xl font-semibold text-slate-950"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={signInHref}
          className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Continue to sign in
        </Link>
        {!isLoaded && (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">
            Checking session
          </span>
        )}
      </div>
    </div>
  );
}
