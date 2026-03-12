import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/server/prisma";

const DB_READY_TIMEOUT_MS = 3_000;

type HealthCheck = {
  ok: boolean;
  status: "ok" | "warn" | "fail";
  message: string;
};

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${label} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      promise.finally(() => clearTimeout(timeoutId)).catch(() => undefined);
    }),
  ]);
}

function resolveAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const vercelProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ?? "";
  if (vercelProductionUrl) {
    return vercelProductionUrl.startsWith("http")
      ? vercelProductionUrl
      : `https://${vercelProductionUrl}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim() ?? "";
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "";
}

function getConfigChecks(isProduction: boolean) {
  const appUrl = resolveAppUrl();
  const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const clerkSk = process.env.CLERK_SECRET_KEY?.trim() ?? "";
  const dbUrl = process.env.DATABASE_URL?.trim() ?? "";

  const config: HealthCheck = { ok: true, status: "ok", message: "Core env vars are set." };
  const auth: HealthCheck = { ok: true, status: "ok", message: "Clerk auth keys look valid." };

  const parsedAppUrl = parseUrl(appUrl);
  if (!appUrl || !parsedAppUrl) {
    if (isProduction) {
      config.ok = false;
      config.status = "fail";
      config.message = "Production app URL is missing or invalid.";
    } else {
      config.status = "warn";
      config.message = "Production app URL is missing or invalid.";
    }
  } else if (isProduction && parsedAppUrl.protocol !== "https:") {
    config.ok = false;
    config.status = "fail";
    config.message = "Production app URL must use https:// in production.";
  }

  if (!dbUrl) {
    if (isProduction) {
      config.ok = false;
      config.status = "fail";
      config.message = "DATABASE_URL is missing.";
    } else if (config.status === "ok") {
      config.status = "warn";
      config.message = "DATABASE_URL is missing (app will use fallback data).";
    }
  }

  if (!clerkPk || !clerkSk) {
    auth.ok = !isProduction;
    auth.status = isProduction ? "fail" : "warn";
    auth.message = "Clerk keys are missing.";
  } else if (isProduction && (!clerkPk.startsWith("pk_live_") || !clerkSk.startsWith("sk_live_"))) {
    auth.ok = false;
    auth.status = "fail";
    auth.message = "Clerk production deployment should use pk_live_/sk_live_ keys.";
  }

  return { config, auth };
}

async function getDatabaseCheck(isProduction: boolean): Promise<HealthCheck> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      ok: !isProduction,
      status: isProduction ? "fail" : "warn",
      message: "Prisma is not initialized (missing/invalid DATABASE_URL or Prisma client).",
    };
  }

  try {
    await withTimeout(
      prisma.$queryRawUnsafe("SELECT 1"),
      DB_READY_TIMEOUT_MS,
      "database readiness query",
    );
    return { ok: true, status: "ok", message: "Database connection is ready." };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown database error";
    return {
      ok: false,
      status: "fail",
      message: `Database check failed: ${reason}`,
    };
  }
}

export async function GET() {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const { config, auth } = getConfigChecks(isProduction);
  const database = await getDatabaseCheck(isProduction);

  const checks = { config, auth, database };
  const ok = Object.values(checks).every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      environment: {
        nodeEnv: process.env.NODE_ENV ?? "unknown",
        vercelEnv: process.env.VERCEL_ENV ?? "unknown",
      },
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
