/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const clerkClientMock = vi.fn();
const getPrismaMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
  clerkClient: () => clerkClientMock(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => getPrismaMock(),
}));

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  TEACHER_EMAILS: process.env.TEACHER_EMAILS,
};
const authCacheGlobal = globalThis as typeof globalThis & {
  __learnBridgeUserMemoryCache?: Map<string, unknown>;
  __learnBridgeAccessUserMemoryCache?: Map<string, unknown>;
};

describe("staff/admin access fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    authCacheGlobal.__learnBridgeUserMemoryCache?.clear();
    authCacheGlobal.__learnBridgeAccessUserMemoryCache?.clear();
    process.env.DATABASE_URL = "postgresql://local/test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_local";
    process.env.CLERK_SECRET_KEY = "sk_test_local";
    process.env.ADMIN_EMAILS = "admin@example.com";
    process.env.TEACHER_EMAILS = "teacher@example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
    authCacheGlobal.__learnBridgeUserMemoryCache?.clear();
    authCacheGlobal.__learnBridgeAccessUserMemoryCache?.clear();
    if (originalEnv.DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    }
    if (originalEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === undefined) {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
        originalEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    }
    if (originalEnv.CLERK_SECRET_KEY === undefined) {
      delete process.env.CLERK_SECRET_KEY;
    } else {
      process.env.CLERK_SECRET_KEY = originalEnv.CLERK_SECRET_KEY;
    }
    if (originalEnv.ADMIN_EMAILS === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalEnv.ADMIN_EMAILS;
    }
    if (originalEnv.TEACHER_EMAILS === undefined) {
      delete process.env.TEACHER_EMAILS;
    } else {
      process.env.TEACHER_EMAILS = originalEnv.TEACHER_EMAILS;
    }
  });

  it("allows staff access from Clerk-derived role when Prisma lookup times out", async () => {
    vi.useFakeTimers();
    authMock.mockResolvedValue({ userId: "user_teacher" });
    getPrismaMock.mockReturnValue({
      user: {
        findUnique: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    clerkClientMock.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: "teacher@example.com" }],
          firstName: "Teacher",
          lastName: "One",
        }),
      },
    });

    const { requireStaff } = await import("@/lib/server/auth");
    const accessPromise = requireStaff();

    await vi.advanceTimersByTimeAsync(1_201);
    const access = await accessPromise;

    expect(access).toEqual({
      ok: true,
      user: {
        id: "user_teacher",
        email: "teacher@example.com",
        name: "Teacher One",
        role: "TEACHER",
      },
    });
  });

  it("keeps admin access strict when Clerk fallback resolves a teacher role", async () => {
    vi.useFakeTimers();
    authMock.mockResolvedValue({ userId: "user_teacher" });
    getPrismaMock.mockReturnValue({
      user: {
        findUnique: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    clerkClientMock.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: "teacher@example.com" }],
          firstName: "Teacher",
          lastName: "One",
        }),
      },
    });

    const { requireAdmin } = await import("@/lib/server/auth");
    const accessPromise = requireAdmin();

    await vi.advanceTimersByTimeAsync(1_201);
    const access = await accessPromise;

    expect(access).toEqual({ ok: false, status: 403 });
  });

  it("reuses the global access cache across module reloads", async () => {
    vi.useFakeTimers();
    authMock.mockResolvedValue({ userId: "user_teacher" });
    getPrismaMock.mockReturnValue({
      user: {
        findUnique: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    const clerkGetUserMock = vi.fn().mockResolvedValue({
      emailAddresses: [{ emailAddress: "teacher@example.com" }],
      firstName: "Teacher",
      lastName: "One",
    });
    clerkClientMock.mockResolvedValue({
      users: {
        getUser: clerkGetUserMock,
      },
    });

    const { requireStaff } = await import("@/lib/server/auth");
    const firstAccessPromise = requireStaff();

    await vi.advanceTimersByTimeAsync(1_201);
    const firstAccess = await firstAccessPromise;

    expect(firstAccess).toEqual({
      ok: true,
      user: {
        id: "user_teacher",
        email: "teacher@example.com",
        name: "Teacher One",
        role: "TEACHER",
      },
    });
    expect(clerkGetUserMock).toHaveBeenCalledTimes(1);

    vi.resetModules();
    authMock.mockResolvedValue({ userId: "user_teacher" });
    getPrismaMock.mockReturnValue({
      user: {
        findUnique: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });
    clerkClientMock.mockResolvedValue({
      users: {
        getUser: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    });

    const { requireStaff: requireStaffAgain } = await import("@/lib/server/auth");
    const secondAccess = await requireStaffAgain();

    expect(secondAccess).toEqual(firstAccess);
    expect(clerkGetUserMock).toHaveBeenCalledTimes(1);
  });
});
