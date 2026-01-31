import Link from "next/link";
import { ensureUser } from "@/lib/server/auth";
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

export default async function SiteHeader() {
  const user = isClerkConfigured() ? await ensureUser() : null;
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-amber-50/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-300 text-orange-950">
            E
          </span>
          EduTech
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href.startsWith("/dashboard") || item.href.startsWith("/games") ? false : undefined}
              className="rounded-full px-3 py-1 transition hover:bg-white/70"
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
