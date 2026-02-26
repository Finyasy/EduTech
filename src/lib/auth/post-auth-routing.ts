export type PostAuthRole = "ADMIN" | "TEACHER" | "STUDENT";

type PostAuthRedirectOptions = {
  clerkPublishableKey?: string | null;
  userId: string | null;
  userRole: PostAuthRole | null;
  postAuthPath?: string;
};

export function isClerkPublishableKeyConfigured(key?: string | null) {
  return Boolean(key?.startsWith("pk_") && !key.endsWith("..."));
}

export function getPostAuthRedirectTarget({
  clerkPublishableKey,
  userId,
  userRole,
  postAuthPath = "/post-auth",
}: PostAuthRedirectOptions) {
  if (!isClerkPublishableKeyConfigured(clerkPublishableKey)) {
    return "/dashboard";
  }

  if (!userId) {
    return `/sign-in?redirect_url=${encodeURIComponent(postAuthPath)}`;
  }

  if (!userRole) {
    // Optimistic fast path: staff routes still enforce access, and students get bounced.
    return "/teach";
  }

  if (userRole === "ADMIN" || userRole === "TEACHER") {
    return "/teach";
  }

  return "/dashboard";
}
