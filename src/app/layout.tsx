import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fredoka, Manrope } from "next/font/google";
import "./globals.css";

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
  title: "EduTech",
  description:
    "A playful learning platform for kids with videos, quizzes, and games.",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPublishableKey &&
  clerkPublishableKey.startsWith("pk_") &&
  !clerkPublishableKey.endsWith("...");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-amber-50 text-slate-900 antialiased`}
      >
        {isClerkConfigured ? (
          <ClerkProvider>{children}</ClerkProvider>
        ) : (
          <>
            <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">
              Auth is off. Add Clerk keys to <code className="rounded bg-amber-200/50 px-1">.env</code> —{" "}
              <a
                href="https://dashboard.clerk.com/last-active?path=api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900"
              >
                Get keys
              </a>
            </div>
            {children}
          </>
        )}
      </body>
    </html>
  );
}
