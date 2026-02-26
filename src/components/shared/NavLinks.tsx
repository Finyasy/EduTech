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

  if (!clerkEnabled) {
    return null;
  }

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
        className={`inline-flex min-h-11 items-center rounded-full px-3 py-2 transition ${
          isActive
            ? "bg-white text-slate-900 shadow-sm"
            : "hover:bg-white/80 hover:text-slate-900"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <SignedIn>
      {publicItems.map(renderLink)}
      {authItems.map(renderLink)}
    </SignedIn>
  );
}
