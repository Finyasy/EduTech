import { auth, clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import type { User } from "@prisma/client";
import { isClerkPublishableKeyConfigured } from "@/lib/auth/post-auth-routing";
import { getPrisma } from "@/lib/server/prisma";

const USER_MEMORY_CACHE_TTL_MS = 5 * 60 * 1000;
const USER_MEMORY_CACHE_STALE_TTL_MS =
  process.env.NODE_ENV === "development"
    ? 30 * 60 * 1000
    : USER_MEMORY_CACHE_TTL_MS;
const ACCESS_LOOKUP_TIMEOUT_MS = 1_200;
const AUTH_QUERY_TIMEOUT_MS = 1_000;
const CLERK_SYNC_TIMEOUT_MS = 1_000;
type AccessUser = Pick<User, "id" | "email" | "name" | "role">;
type TimedCacheEntry<T> = { expiresAt: number; staleAt: number; value: T };
const globalForAuthCache = globalThis as typeof globalThis & {
  __learnBridgeUserMemoryCache?: Map<string, TimedCacheEntry<User>>;
  __learnBridgeAccessUserMemoryCache?: Map<string, TimedCacheEntry<AccessUser>>;
};
const userMemoryCache =
  globalForAuthCache.__learnBridgeUserMemoryCache ??
  new Map<string, TimedCacheEntry<User>>();
const accessUserMemoryCache =
  globalForAuthCache.__learnBridgeAccessUserMemoryCache ??
  new Map<string, TimedCacheEntry<AccessUser>>();

globalForAuthCache.__learnBridgeUserMemoryCache = userMemoryCache;
globalForAuthCache.__learnBridgeAccessUserMemoryCache = accessUserMemoryCache;

const parseEmailList = (rawList: string) =>
  rawList
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const parseAdminEmails = () =>
  parseEmailList(process.env.ADMIN_EMAILS ?? "");

const parseTeacherEmails = () =>
  parseEmailList(process.env.TEACHER_EMAILS ?? "");

const shouldUseRequestTimeClerkSync = () =>
  process.env.NODE_ENV !== "production" ||
  !process.env.CLERK_WEBHOOK_SIGNING_SECRET;

const withAuthLookupTimeout = <T,>(
  promise: Promise<T>,
  label: string,
  timeoutMs: number,
) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs),
    ),
  ]);

const getRoleForEmail = (email: string) => {
  const normalizedEmail = email.toLowerCase();
  const adminEmails = parseAdminEmails();
  const teacherEmails = parseTeacherEmails();

  return adminEmails.includes(normalizedEmail)
    ? "ADMIN"
    : teacherEmails.includes(normalizedEmail)
      ? "TEACHER"
      : "STUDENT";
};

const readUserMemoryCache = (
  userId: string,
  options?: { allowStale?: boolean },
) => {
  const cached = userMemoryCache.get(userId);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (cached.expiresAt > now) {
    return cached.value;
  }

  if (options?.allowStale && cached.staleAt > now) {
    return cached.value;
  }

  userMemoryCache.delete(userId);
  return null;
};

const writeUserMemoryCache = (user: User | null) => {
  if (!user) {
    return user;
  }

  const now = Date.now();
  userMemoryCache.set(user.id, {
    value: user,
    expiresAt: now + USER_MEMORY_CACHE_TTL_MS,
    staleAt: now + USER_MEMORY_CACHE_STALE_TTL_MS,
  });
  return user;
};

const readAccessUserMemoryCache = (
  userId: string,
  options?: { allowStale?: boolean },
) => {
  const cached = accessUserMemoryCache.get(userId);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (cached.expiresAt > now) {
    return cached.value;
  }

  if (options?.allowStale && cached.staleAt > now) {
    return cached.value;
  }

  accessUserMemoryCache.delete(userId);
  return null;
};

const writeAccessUserMemoryCache = (user: AccessUser | null) => {
  if (!user) {
    return user;
  }

  const now = Date.now();
  accessUserMemoryCache.set(user.id, {
    value: user,
    expiresAt: now + USER_MEMORY_CACHE_TTL_MS,
    staleAt: now + USER_MEMORY_CACHE_STALE_TTL_MS,
  });
  return user;
};

const toAccessUser = (
  user: Pick<User, "id" | "email" | "name" | "role"> | null,
): AccessUser | null => {
  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

export const isLearnerRole = (role: User["role"] | null | undefined) =>
  role === "STUDENT";

export type AuthState =
  | { status: "disabled"; userId: null }
  | { status: "timed_out"; userId: null }
  | { status: "unauthenticated"; userId: null }
  | { status: "authenticated"; userId: string };

export async function getAuthStateWithTimeout(timeoutMs: number): Promise<AuthState> {
  if (!isClerkPublishableKeyConfigured(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    return { status: "disabled", userId: null };
  }

  try {
    return await Promise.race<AuthState>([
      auth().then(({ userId }) =>
        userId
          ? { status: "authenticated", userId }
          : { status: "unauthenticated", userId: null },
      ),
      new Promise<AuthState>((resolve) =>
        setTimeout(() => resolve({ status: "timed_out", userId: null }), timeoutMs),
      ),
    ]);
  } catch {
    return { status: "timed_out", userId: null };
  }
}

/**
 * ensureUser with an optional timeout. Use in pages/routes to avoid hanging if Clerk or DB is slow.
 */
const ensureUserCached = (userId: string) =>
  unstable_cache(
    () => ensureUserById(userId),
    ["user", userId],
    { revalidate: 60, tags: [`user:${userId}`] },
  )();

export async function ensureUserByIdWithTimeout(userId: string, timeoutMs: number) {
  const cached = readUserMemoryCache(userId);
  if (cached) {
    return cached;
  }

  try {
    return await Promise.race([
      ensureUserCached(userId),
      new Promise<Awaited<ReturnType<typeof ensureUserCached>>>((resolve) =>
        setTimeout(() => resolve(readUserMemoryCache(userId, { allowStale: true })), timeoutMs),
      ),
    ]);
  } catch {
    return readUserMemoryCache(userId, { allowStale: true });
  }
}

export async function ensureUserWithTimeout(timeoutMs: number) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    return await ensureUserByIdWithTimeout(userId, timeoutMs);
  } catch {
    return null;
  }
}

export async function ensureLearnerByIdWithTimeout(
  userId: string,
  timeoutMs: number,
) {
  const user = await ensureUserByIdWithTimeout(userId, timeoutMs);
  if (!user) {
    return { status: "unauthorized" as const, user: null };
  }

  if (!isLearnerRole(user.role)) {
    return { status: "forbidden" as const, user: null };
  }

  return { status: "ok" as const, user };
}

async function getAccessUserWithTimeout(
  userId: string,
  timeoutMs: number,
): Promise<AccessUser | null> {
  const cached = readAccessUserMemoryCache(userId);
  if (cached) {
    return cached;
  }

  const staleUser = readAccessUserMemoryCache(userId, { allowStale: true });
  try {
    return await Promise.race([
      (async () => {
        const dbUser = await ensureUserByIdWithTimeout(userId, timeoutMs);
        const accessUser = toAccessUser(dbUser);
        if (accessUser) {
          return writeAccessUserMemoryCache(accessUser);
        }
        return staleUser;
      })(),
      new Promise<AccessUser | null>((resolve) =>
        setTimeout(() => resolve(staleUser), timeoutMs),
      ),
    ]);
  } catch {
    return staleUser;
  }
}

async function ensureUserById(userId: string) {
  const cached = readUserMemoryCache(userId);
  if (cached) {
    return cached;
  }

  const staleUser = readUserMemoryCache(userId, { allowStale: true });
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  try {
    const existingUser = await withAuthLookupTimeout(
      prisma.user.findUnique({
        where: { id: userId },
      }),
      "auth user lookup",
      AUTH_QUERY_TIMEOUT_MS,
    );

    if (existingUser?.email) {
      const role = getRoleForEmail(existingUser.email);
      if (existingUser.role === role) {
        return writeUserMemoryCache(existingUser);
      }

      return writeUserMemoryCache(
        await withAuthLookupTimeout(
          prisma.user.update({
            where: { id: userId },
            data: { role },
          }),
          "auth user role sync",
          AUTH_QUERY_TIMEOUT_MS,
        ),
      );
    }

    if (!process.env.CLERK_SECRET_KEY || !shouldUseRequestTimeClerkSync()) {
      return writeUserMemoryCache(existingUser);
    }

    const client = await clerkClient();
    const clerkUser = await withAuthLookupTimeout(
      client.users.getUser(userId),
      "clerk user lookup",
      CLERK_SYNC_TIMEOUT_MS,
    );
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (!primaryEmail) {
      return null;
    }

    const displayName =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
      null;

    const role = getRoleForEmail(primaryEmail);

    return writeUserMemoryCache(
      await withAuthLookupTimeout(
        prisma.user.upsert({
          where: { id: userId },
          update: {
            email: primaryEmail,
            name: displayName,
            role,
          },
          create: {
            id: userId,
            email: primaryEmail,
            name: displayName,
            role,
          },
        }),
        "auth user upsert",
        AUTH_QUERY_TIMEOUT_MS,
      ),
    );
  } catch (error) {
    if (staleUser) {
      return staleUser;
    }
    throw error;
  }
}

export async function ensureUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const cached = readUserMemoryCache(userId);
  if (cached) {
    return cached;
  }

  return ensureUserCached(userId);
}

export async function requireAdmin() {
  if (!process.env.DATABASE_URL || !getPrisma()) {
    return { ok: false, status: 501 };
  }

  const authState = await getAuthStateWithTimeout(ACCESS_LOOKUP_TIMEOUT_MS);
  if (authState.status !== "authenticated") {
    return { ok: false, status: 401 };
  }

  const user = await getAccessUserWithTimeout(
    authState.userId,
    ACCESS_LOOKUP_TIMEOUT_MS,
  );

  if (!user) {
    return { ok: false, status: 401 };
  }

  if (user.role !== "ADMIN") {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}

export async function requireStaff() {
  if (!process.env.DATABASE_URL || !getPrisma()) {
    return { ok: false, status: 501 };
  }

  const authState = await getAuthStateWithTimeout(ACCESS_LOOKUP_TIMEOUT_MS);
  if (authState.status !== "authenticated") {
    return { ok: false, status: 401 };
  }

  const user = await getAccessUserWithTimeout(
    authState.userId,
    ACCESS_LOOKUP_TIMEOUT_MS,
  );

  if (!user) {
    return { ok: false, status: 401 };
  }

  if (user.role !== "ADMIN" && user.role !== "TEACHER") {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}
