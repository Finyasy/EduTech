import { NextResponse } from "next/server";

export type ParsedJsonBody<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export const DATABASE_ROUTE_TIMEOUT_MS = 3_000;
type DatabaseFailureMetadataValue = string | number | boolean | null | undefined;
type DatabaseFailureMetadata = Record<string, DatabaseFailureMetadataValue>;

class RouteTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = "RouteTimeoutError";
  }
}

export async function parseJsonBody<T>(
  request: Request,
): Promise<ParsedJsonBody<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      ),
    };
  }
}

export async function withRouteTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = DATABASE_ROUTE_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new RouteTimeoutError(label, timeoutMs));
      }, timeoutMs);
      promise.finally(() => clearTimeout(timeoutId)).catch(() => undefined);
    }),
  ]);
}

const toStructuredFailureMetadata = (
  contextOrMetadata: string | (DatabaseFailureMetadata & { context?: string }),
) => {
  if (typeof contextOrMetadata === "string") {
    return {
      context: contextOrMetadata,
      metadata: {} as DatabaseFailureMetadata,
    };
  }

  const { context = "database", ...metadata } = contextOrMetadata;
  return { context, metadata };
};

export function toDatabaseFailureResponse(
  error: unknown,
  contextOrMetadata: string | (DatabaseFailureMetadata & { context?: string }) = "database",
) {
  const { context, metadata } = toStructuredFailureMetadata(contextOrMetadata);
  const isTimeout = isDatabaseFailureError(error);
  const reason = error instanceof Error ? error.message : String(error ?? "unknown");
  const errorName = error instanceof Error ? error.name : typeof error;
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  console.error("[db-route-failure]", {
    context,
    timeout: isTimeout,
    reason,
    errorName,
    errorCode: errorCode || undefined,
    ...metadata,
  });

  return NextResponse.json(
    {
      error: isTimeout
        ? "Database request timed out"
        : "Database temporarily unavailable",
    },
    { status: 503 },
  );
}

export function isDatabaseFailureError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === "RouteTimeoutError") {
    return true;
  }

  const message = error.message;
  return (
    message.includes("timed out") ||
    message.includes("Connection timeout") ||
    message.includes("Can't reach database server") ||
    message.includes("database") ||
    message.includes("Persistent teacher store unavailable")
  );
}
