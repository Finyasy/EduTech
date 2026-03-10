import {
  getPostAuthRedirectTarget,
  normalizeAppRedirectPath,
} from "@/lib/auth/post-auth-routing";
import {
  ensureUserByIdWithTimeout,
  getAuthStateWithTimeout,
} from "@/lib/server/auth";
import PostAuthRedirectClient from "./PostAuthRedirectClient";

const postAuthRedirectUrl = "/post-auth";
const authTimeoutMs = 700;
const roleLookupTimeoutMs = 800;

export const dynamic = "force-dynamic";

type PostAuthPageProps = {
  searchParams?: Promise<{ redirect_url?: string | string[] }>;
};

export default async function PostAuthPage({ searchParams }: PostAuthPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectUrlValue = resolvedSearchParams?.redirect_url;
  const requestedPath = normalizeAppRedirectPath(
    Array.isArray(redirectUrlValue) ? redirectUrlValue[0] : redirectUrlValue,
  );

  const authState = await getAuthStateWithTimeout(authTimeoutMs);
  const user = authState.status === "authenticated" && authState.userId && !requestedPath
    ? await ensureUserByIdWithTimeout(authState.userId, roleLookupTimeoutMs)
    : null;

  const target = getPostAuthRedirectTarget({
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    userId: authState.status === "authenticated" ? authState.userId : null,
    userRole: user?.role ?? null,
    postAuthPath: postAuthRedirectUrl,
    requestedPath,
  });

  return (
    <PostAuthRedirectClient
      authState={authState}
      requestedPath={requestedPath}
      target={target}
    />
  );
}
