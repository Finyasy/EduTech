/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getPrismaMock = vi.fn();

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => getPrismaMock(),
}));

const originalEnv = { ...process.env };

function setProductionEnv() {
  Object.assign(process.env, {
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://edutech.example.com",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_123",
    CLERK_SECRET_KEY: "sk_live_123",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/edutech",
  });
}

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 503 in production when required configuration is missing", async () => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    });
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.DATABASE_URL;
    getPrismaMock.mockReturnValue(null);

    const { GET } = await import("@/app/api/health/ready/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.ok).toBe(false);
    expect(json.checks.config.status).toBe("fail");
    expect(json.checks.auth.status).toBe("fail");
    expect(json.checks.database.status).toBe("fail");
  });

  it("returns 200 in production when config and database are ready", async () => {
    setProductionEnv();
    const queryRawMock = vi.fn().mockResolvedValue([{ ok: 1 }]);
    getPrismaMock.mockReturnValue({ $queryRawUnsafe: queryRawMock });

    const { GET } = await import("@/app/api/health/ready/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.checks.config.status).toBe("ok");
    expect(json.checks.auth.status).toBe("ok");
    expect(json.checks.database.status).toBe("ok");
    expect(queryRawMock).toHaveBeenCalledWith("SELECT 1");
  });

  it("returns 503 when database readiness query times out", async () => {
    vi.useFakeTimers();
    setProductionEnv();
    const queryRawMock = vi.fn().mockReturnValue(new Promise(() => {}));
    getPrismaMock.mockReturnValue({ $queryRawUnsafe: queryRawMock });

    const { GET } = await import("@/app/api/health/ready/route");
    const responsePromise = GET();

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.ok).toBe(false);
    expect(json.checks.database.status).toBe("fail");
    expect(String(json.checks.database.message)).toContain("timeout");
  });
});
