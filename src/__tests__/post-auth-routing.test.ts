import { describe, expect, it } from "vitest";
import {
  getPostAuthRedirectTarget,
  isClerkPublishableKeyConfigured,
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

  it("optimistically routes signed-in users to /teach when role lookup times out", () => {
    expect(
      getPostAuthRedirectTarget({
        clerkPublishableKey: validKey,
        userId: "user_123",
        userRole: null,
      }),
    ).toBe("/teach");
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
});
