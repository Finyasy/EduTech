import { auth, clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import { isClerkPublishableKeyConfigured } from "@/lib/auth/post-auth-routing";
import { getPrisma } from "@/lib/server/prisma";

const parseEmailList = (rawList: string) =>
  rawList
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const parseAdminEmails = () =>
  parseEmailList(process.env.ADMIN_EMAILS ?? "");

const parseTeacherEmails = () =>
  parseEmailList(process.env.TEACHER_EMAILS ?? "");

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
  try {
    return await Promise.race([
      ensureUserCached(userId),
      new Promise<Awaited<ReturnType<typeof ensureUserCached>>>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs),
      ),
    ]);
  } catch {
    return null;
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

async function ensureUserById(userId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (existingUser?.email) {
    const role = getRoleForEmail(existingUser.email);
    if (existingUser.role === role) {
      return existingUser;
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  if (!process.env.CLERK_SECRET_KEY) {
    return existingUser;
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

  if (!primaryEmail) {
    return null;
  }

  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    null;

  const role = getRoleForEmail(primaryEmail);

  return prisma.user.upsert({
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
  });
}

export async function ensureUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return ensureUserCached(userId);
}

export async function requireAdmin() {
  if (!process.env.DATABASE_URL || !getPrisma()) {
    return { ok: false, status: 501 };
  }

  const user = await ensureUser();

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

  const user = await ensureUser();

  if (!user) {
    return { ok: false, status: 401 };
  }

  if (user.role !== "ADMIN" && user.role !== "TEACHER") {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}
