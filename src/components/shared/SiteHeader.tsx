import Link from "next/link";
import { ensureUserWithTimeout } from "@/lib/server/auth";
import AuthNav from "./AuthNav";
import NavLinks from "./NavLinks";

const navItems = [
  { href: "/courses", label: "Courses" },
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
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/72 px-4 py-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-3 rounded-full pr-2 text-lg font-semibold tracking-tight text-slate-950"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#fde68a_38%,#a7f3d0_72%,#bae6fd_100%)] text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_20px_rgba(15,23,42,0.12)]">
            LB
          </span>
          LearnBridge
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <NavLinks items={navItems} clerkEnabled={clerkEnabled} />
          {clerkEnabled && <AuthNav isStaff={isStaff} isAdmin={isAdmin} />}
        </nav>
      </div>
    </header>
  );
}
