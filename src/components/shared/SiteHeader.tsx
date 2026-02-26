import Link from "next/link";
import { ensureUserWithTimeout } from "@/lib/server/auth";
import AuthNav from "./AuthNav";
import NavLinks from "./NavLinks";

const navItems = [
  { href: "/courses", label: "Courses", authOnly: true },
  { href: "/dashboard", label: "Dashboard", authOnly: true },
  { href: "/games", label: "Games", authOnly: true },
];

const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key.endsWith("..."));
};

type SiteHeaderProps = {
  withAuth?: boolean;
  isStaff?: boolean;
  isAdmin?: boolean;
};

export default async function SiteHeader({
  withAuth = true,
  isStaff: staffHint,
  isAdmin: adminHint,
}: SiteHeaderProps) {
  const clerkEnabled = isClerkConfigured();
  const shouldCheckAuth = withAuth && clerkEnabled;
  const shouldUseHints =
    typeof staffHint === "boolean" || typeof adminHint === "boolean";
  const user =
    !shouldUseHints && shouldCheckAuth ? await ensureUserWithTimeout(1500) : null;
  const isAdmin = shouldUseHints ? Boolean(adminHint) : user?.role === "ADMIN";
  const isStaff = shouldUseHints
    ? Boolean(staffHint)
    : user?.role === "ADMIN" || user?.role === "TEACHER";

  return (
    <header className="sticky top-0 z-20 border-b border-amber-100/80 bg-amber-50/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full pr-2 text-lg font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 via-amber-200 to-sky-200 text-orange-950 shadow-sm">
            LB
          </span>
          LearnBridge
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-700">
          <NavLinks items={navItems} clerkEnabled={clerkEnabled} />
          {clerkEnabled && <AuthNav isStaff={isStaff} isAdmin={isAdmin} />}
        </nav>
      </div>
    </header>
  );
}
