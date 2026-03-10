"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn } from "@clerk/nextjs";

export type NavItem = {
  href: string;
  label: string;
  authOnly?: boolean;
};

type NavLinksProps = {
  items: NavItem[];
  clerkEnabled: boolean;
};

export default function NavLinks({ items, clerkEnabled }: NavLinksProps) {
  const pathname = usePathname();

  const publicItems = items.filter((item) => !item.authOnly);
  const authItems = items.filter((item) => item.authOnly);

  const renderLink = (item: NavItem) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`));

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={item.href.startsWith("/admin") ? false : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`inline-flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm font-semibold transition ${
          isActive
            ? "bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]"
            : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {publicItems.map(renderLink)}
      {clerkEnabled && <SignedIn>{authItems.map(renderLink)}</SignedIn>}
    </>
  );
}
