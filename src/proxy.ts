import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { NextFetchEvent } from "next/server";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const isClerkConfigured = Boolean(
  clerkPublishableKey?.startsWith("pk_") &&
    !clerkPublishableKey.endsWith("...") &&
    clerkSecretKey,
);

const clerk = clerkMiddleware();

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured || req.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  return clerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
