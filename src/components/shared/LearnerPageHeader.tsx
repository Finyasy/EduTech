import type { ReactNode } from "react";

type LearnerPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  titleClassName?: string;
};

export default function LearnerPageHeader({
  eyebrow,
  title,
  description,
  badges,
  actions,
  children,
  titleClassName,
}: LearnerPageHeaderProps) {
  return (
    <header className="relative z-10 rounded-[2.25rem] border border-white/70 bg-white px-6 py-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)] md:px-8 md:py-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </p>
          {badges}
        </div>
        <div className="space-y-3">
          <h1
            className={titleClassName ?? "text-3xl font-semibold leading-tight text-slate-950 md:text-4xl"}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        {children}
      </div>
    </header>
  );
}
