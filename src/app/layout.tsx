import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { logRuntimeReadinessWarningsOnce } from "@/lib/server/runtime-readiness";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnBridge",
  description:
    "A playful learning platform for kids with stories, quizzes, and games.",
};

function LayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-amber-50 text-slate-900 antialiased">
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
  logRuntimeReadinessWarningsOnce();
  const content = <LayoutContent>{children}</LayoutContent>;
  return <ClerkProvider>{content}</ClerkProvider>;
}
