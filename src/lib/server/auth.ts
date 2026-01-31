import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/server/prisma";

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export async function ensureUser() {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  const clerkUser = await currentUser();
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
