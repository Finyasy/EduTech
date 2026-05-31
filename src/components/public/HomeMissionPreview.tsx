"use client";

import { useState } from "react";
import Link from "next/link";
import { buildSignInRedirectUrl } from "@/lib/auth/post-auth-routing";

type MissionPreview = {
  id: string;
  label: string;
  title: string;
  ageBand: string;
  concept: string;
  build: string;
  explain: string;
  tone: string;
};

const previews: MissionPreview[] = [
  {
    id: "preview-pattern",
    label: "Sample mission",
    title: "AI Pattern Detectives",
    ageBand: "Ages 5-7",
    concept: "Spot what changes, what repeats, and how a robot could sort it.",
    build: "Group shapes into matching buckets and test one sorting rule.",
    explain: "Tell a teacher why one item belongs in a different group.",
    tone: "border-amber-200 bg-amber-50/90 text-amber-950",
  },
  {
    id: "preview-robot",
    label: "Sample mission",
    title: "Robot Coders Math Lab",
    ageBand: "Ages 8-10",
    concept: "Use step logic, counts, and coordinates to move a robot accurately.",
    build: "Choose commands, test them, and fix one route mistake.",
    explain: "Show the maths behind the robot's final path.",
    tone: "border-sky-200 bg-sky-50/90 text-sky-950",
  },
];

export default function HomeMissionPreview() {
  const [activePreview, setActivePreview] = useState<MissionPreview | null>(null);

  return (
    <>
      <section className="glass-shell rounded-[2.5rem] border border-white/70 px-6 py-8 shadow-[0_22px_52px_rgba(15,23,42,0.08)] md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
              Public mission previews
            </p>
            <h2
              className="mt-2 text-3xl font-semibold text-slate-950"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Let learners try two guided samples before the full library opens.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              These previews show the learning rhythm and the kind of thinking the platform asks
              for. The full mission library, saved progress, and build evidence stay private.
            </p>
          </div>
          <Link
            href={buildSignInRedirectUrl("/courses")}
            className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Unlock full library
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {previews.map((preview) => (
            <article
              key={preview.id}
              className={`rounded-[1.8rem] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] ${preview.tone}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
                {preview.label}
              </p>
              <h3
                className="mt-2 text-2xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {preview.title}
              </h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {preview.ageBand}
              </p>
              <p className="mt-4 text-sm leading-6 opacity-90">{preview.concept}</p>
              <button
                type="button"
                onClick={() => setActivePreview(preview)}
                className="mt-5 inline-flex min-h-11 items-center rounded-full border border-current/15 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                Try preview
              </button>
            </article>
          ))}
        </div>
      </section>

      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Sample preview
                  </p>
                  <h3
                    className="mt-2 text-3xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {activePreview.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{activePreview.ageBand}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 transition hover:border-slate-300"
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
              <article className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Learn
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-950">{activePreview.concept}</p>
              </article>
              <article className="rounded-[1.4rem] border border-sky-100 bg-sky-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Build
                </p>
                <p className="mt-2 text-sm leading-6 text-sky-950">{activePreview.build}</p>
              </article>
              <article className="rounded-[1.4rem] border border-amber-100 bg-amber-50/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Explain
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-950">{activePreview.explain}</p>
              </article>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-5">
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                The full course library, saved progress, lesson unlocks, and build evidence open
                after sign-in.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={buildSignInRedirectUrl("/courses")}
                  className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Continue to full courses
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Create learner account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
