import { auth } from "@clerk/nextjs/server";
import {
  getPostAuthRedirectTarget,
} from "@/lib/auth/post-auth-routing";
import { ensureUserByIdWithTimeout } from "@/lib/server/auth";
import PostAuthRedirectClient from "./PostAuthRedirectClient";

const postAuthRedirectUrl = "/post-auth";
const authTimeoutMs = 1200;
const roleLookupTimeoutMs = 1000;

export const dynamic = "force-dynamic";

async function authWithTimeout() {
  try {
    return await Promise.race([
      auth(),
      new Promise<Awaited<ReturnType<typeof auth>>>((resolve) =>
        setTimeout(() => resolve({ userId: null } as Awaited<ReturnType<typeof auth>>), authTimeoutMs),
      ),
    ]);
  } catch {
    return { userId: null } as Awaited<ReturnType<typeof auth>>;
  }
}

export default async function PostAuthPage() {
  const { userId } = await authWithTimeout();
  const user = userId
    ? await ensureUserByIdWithTimeout(userId, roleLookupTimeoutMs)
    : null;

  const target = getPostAuthRedirectTarget({
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    userId,
    userRole: user?.role ?? null,
    postAuthPath: postAuthRedirectUrl,
  });

  return <PostAuthRedirectClient target={target} />;
}
