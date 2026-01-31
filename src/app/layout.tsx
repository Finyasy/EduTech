import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fredoka, Manrope } from "next/font/google";
import "./globals.css";
import AppHeaderAuth from "@/components/shared/AppHeaderAuth";

const displayFont = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LearnBridge",
  description:
    "A playful learning platform for kids with stories, quizzes, and games.",
};

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key?.endsWith("..."));
}

function LayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-amber-50 text-slate-900 antialiased`}
      >
        <header className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3">
            <AppHeaderAuth clerkEnabled={isClerkConfigured()} />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = <LayoutContent>{children}</LayoutContent>;
  return <ClerkProvider>{content}</ClerkProvider>;
}
