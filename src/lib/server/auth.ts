import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/server/prisma";

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

/**
 * ensureUser with an optional timeout. Use in pages/routes to avoid hanging if Clerk or DB is slow.
 */
export async function ensureUserWithTimeout(timeoutMs: number) {
  try {
    return await Promise.race([
      ensureUser(),
      new Promise<Awaited<ReturnType<typeof ensureUser>>>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs),
      ),
    ]);
  } catch {
    return null;
  }
}

export async function ensureUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  if (!process.env.CLERK_SECRET_KEY) {
    return null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return null;
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

  const adminEmails = parseAdminEmails();
  const shouldBeAdmin = adminEmails.includes(primaryEmail.toLowerCase());

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email: primaryEmail,
      name: displayName,
      role: shouldBeAdmin ? "ADMIN" : undefined,
    },
    create: {
      id: userId,
      email: primaryEmail,
      name: displayName,
      role: shouldBeAdmin ? "ADMIN" : "STUDENT",
    },
  });
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
