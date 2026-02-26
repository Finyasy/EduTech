import "server-only";
import { auth } from "@clerk/nextjs/server";
import { requireStaff } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key.endsWith("..."));
};

const hasDatabase = () => Boolean(process.env.DATABASE_URL && getPrisma());

export async function getTeacherOwnerKey() {
  if (!isClerkConfigured()) {
    return "local-demo";
  }

  if (hasDatabase()) {
    const staffCheck = await requireStaff();
    if (!staffCheck.ok || !staffCheck.user) {
      return null;
    }
    return staffCheck.user.id;
  }

  const { userId } = await auth();
  return userId ?? null;
}
