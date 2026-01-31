import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-amber-50 text-slate-900 antialiased`}
        >
          <header className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
