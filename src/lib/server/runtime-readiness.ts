const globalRuntimeState = globalThis as typeof globalThis & {
  __edutechRuntimeWarningsLogged?: boolean;
};

function resolveAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) {
    return vercelProductionUrl.startsWith("http")
      ? vercelProductionUrl
      : `https://${vercelProductionUrl}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "";
}

export function getRuntimeReadinessWarnings() {
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";
  const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const clerkSk = process.env.CLERK_SECRET_KEY ?? "";

  if (isProduction) {
    if (clerkPk.startsWith("pk_test_")) {
      warnings.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY uses a Clerk development key in production.");
    }
    if (clerkSk.startsWith("sk_test_")) {
      warnings.push("CLERK_SECRET_KEY uses a Clerk development key in production.");
    }
    if (!resolveAppUrl()) {
      warnings.push("No production app URL is set. Redirects and absolute links may be inconsistent.");
    }
    if (!process.env.DATABASE_URL) {
      warnings.push("DATABASE_URL is not set. Production will run on fallback/mock data only.");
    }
    if (process.env.NEXT_PUBLIC_CLERK_DISABLE_SOCIAL === "1") {
      warnings.push("NEXT_PUBLIC_CLERK_DISABLE_SOCIAL=1 is enabled in production. Social auth is disabled.");
    }
  }

  if (clerkPk && !clerkSk && isProduction) {
    warnings.push("CLERK_SECRET_KEY is missing while Clerk publishable key is configured.");
  }

  return warnings;
}

export function logRuntimeReadinessWarningsOnce() {
  if (globalRuntimeState.__edutechRuntimeWarningsLogged) {
    return;
  }
  globalRuntimeState.__edutechRuntimeWarningsLogged = true;

  const warnings = getRuntimeReadinessWarnings();
  if (warnings.length === 0) {
    return;
  }

  console.warn("[runtime-readiness] Production config warnings detected:");
  warnings.forEach((warning) => {
    console.warn(`[runtime-readiness] - ${warning}`);
  });
}
