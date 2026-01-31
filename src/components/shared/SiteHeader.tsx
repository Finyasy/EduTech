import Link from "next/link";
import { ensureUserWithTimeout } from "@/lib/server/auth";
import AuthNav from "./AuthNav";

const navItems = [
  { href: "/courses", label: "Courses" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/games", label: "Games" },
];

const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key.endsWith("..."));
};

type SiteHeaderProps = {
  withAuth?: boolean;
};

export default async function SiteHeader({ withAuth = true }: SiteHeaderProps) {
  const shouldCheckAuth = withAuth && isClerkConfigured();
  const user = shouldCheckAuth ? await ensureUserWithTimeout(1500) : null;
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-20 border-b border-amber-100/80 bg-amber-50/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 via-amber-200 to-sky-200 text-orange-950 shadow-sm">
            LB
          </span>
          LearnBridge
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href.startsWith("/dashboard") || item.href.startsWith("/games") ? false : undefined}
              className="rounded-full px-3 py-1 transition hover:bg-white/80 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          {isClerkConfigured() && <AuthNav isAdmin={isAdmin} />}
        </nav>
      </div>
    </header>
  );
}
