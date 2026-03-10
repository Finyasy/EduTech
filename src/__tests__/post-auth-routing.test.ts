import { describe, expect, it } from "vitest";
import {
  buildSignInRedirectUrl,
  getPostAuthRedirectTarget,
  isClerkPublishableKeyConfigured,
  normalizeAppRedirectPath,
} from "@/lib/auth/post-auth-routing";

describe("isClerkPublishableKeyConfigured", () => {
  it("returns false for missing or placeholder keys", () => {
    expect(isClerkPublishableKeyConfigured(undefined)).toBe(false);
    expect(isClerkPublishableKeyConfigured(null)).toBe(false);
    expect(isClerkPublishableKeyConfigured("")).toBe(false);
    expect(isClerkPublishableKeyConfigured("pk_test_...")).toBe(false);
    expect(isClerkPublishableKeyConfigured("not-a-clerk-key")).toBe(false);
  });

  it("returns true for valid-looking Clerk publishable keys", () => {
    expect(isClerkPublishableKeyConfigured("pk_test_123456")).toBe(true);
    expect(isClerkPublishableKeyConfigured("pk_live_abcdef")).toBe(true);
  });
});

describe("getPostAuthRedirectTarget", () => {
  const validKey = "pk_test_123";

  it("sends users to dashboard when Clerk is not configured", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: "pk_test_...",
        userId: null,
        userRole: null,
      }),
    ).toBe("/dashboard");
  });

  it("redirects unauthenticated users to sign-in with encoded post-auth redirect", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: null,
        userRole: null,
      }),
    ).toBe("/sign-in?redirect_url=%2Fpost-auth");

    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: null,
        userRole: null,
        postAuthPath: "/post-auth?source=clerk",
      }),
    ).toBe("/sign-in?redirect_url=%2Fpost-auth%3Fsource%3Dclerk");
  });

  it("routes signed-in users without a resolved role to /dashboard by default", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_123",
        userRole: null,
      }),
    ).toBe("/dashboard");
  });

  it("routes admin and teacher users to /teach", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_admin",
        userRole: "ADMIN",
      }),
    ).toBe("/teach");

    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_teacher",
        userRole: "TEACHER",
      }),
    ).toBe("/teach");
  });

  it("routes students to /dashboard", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_student",
        userRole: "STUDENT",
      }),
    ).toBe("/dashboard");
  });

  it("honors a valid requested path for signed-in users", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_123",
        userRole: null,
        requestedPath: "/teach",
      }),
    ).toBe("/teach");

    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_123",
        userRole: "STUDENT",
        requestedPath: "/games/game-logic-quest",
      }),
    ).toBe("/games/game-logic-quest");
  });

  it("reuses a requested path when redirecting signed-out users to sign-in", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: null,
        userRole: null,
        requestedPath: "/games",
      }),
    ).toBe("/sign-in?redirect_url=%2Fgames");
  });
});

describe("normalizeAppRedirectPath", () => {
  it("keeps internal paths and strips external targets", () => {
    expect(normalizeAppRedirectPath("/games")).toBe("/games");
    expect(normalizeAppRedirectPath("/dashboard?tab=progress")).toBe(
      "/dashboard?tab=progress",
    );
    expect(normalizeAppRedirectPath("https://example.com/phishing")).toBe(null);
    expect(normalizeAppRedirectPath("//example.com")).toBe(null);
  });
});

describe("buildSignInRedirectUrl", () => {
  it("encodes valid app paths and falls back to /post-auth", () => {
    expect(buildSignInRedirectUrl("/teach")).toBe("/sign-in?redirect_url=%2Fteach");
    expect(buildSignInRedirectUrl("https://example.com")).toBe(
      "/sign-in?redirect_url=%2Fpost-auth",
    );
  });
});
