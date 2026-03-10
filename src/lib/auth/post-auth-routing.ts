export type PostAuthRole = "ADMIN" | "TEACHER" | "STUDENT";

type PostAuthRedirectOptions = {
  clerkPublishableKey?: string | null;
  userId: string | null;
  userRole: PostAuthRole | null;
  postAuthPath?: string;
  requestedPath?: string | null;
};

const INTERNAL_APP_ORIGIN = "https://learnbridge.local";

export function isClerkPublishableKeyConfigured(key?: string | null) {
  return Boolean(key?.startsWith("pk_") && !key.endsWith("..."));
}

export function normalizeAppRedirectPath(rawPath?: string | null) {
  if (!rawPath) {
    return null;
  }

  try {
    const url = new URL(rawPath, INTERNAL_APP_ORIGIN);
    if (url.origin !== INTERNAL_APP_ORIGIN) {
      return null;
    }

    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function buildSignInRedirectUrl(path: string) {
  const redirectPath = normalizeAppRedirectPath(path) ?? "/post-auth";
  return `/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`;
}

export function getPostAuthRedirectTarget({
  clerkPublishableKey,
  userId,
  userRole,
  postAuthPath = "/post-auth",
  requestedPath,
}: PostAuthRedirectOptions) {
  const normalizedPostAuthPath = normalizeAppRedirectPath(postAuthPath) ?? "/post-auth";
  const normalizedRequestedPath = normalizeAppRedirectPath(requestedPath);

  if (!isClerkPublishableKeyConfigured(clerkPublishableKey)) {
    return "/dashboard";
  }

  if (!userId) {
    return buildSignInRedirectUrl(normalizedRequestedPath ?? normalizedPostAuthPath);
  }

  if (normalizedRequestedPath && normalizedRequestedPath !== normalizedPostAuthPath) {
    return normalizedRequestedPath;
  }

  if (userRole === "ADMIN" || userRole === "TEACHER") {
    return "/teach";
  }

  return "/dashboard";
}
