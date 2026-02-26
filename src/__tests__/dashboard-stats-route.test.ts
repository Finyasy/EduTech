/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getDashboardStatsMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/server/data", () => ({
  getDashboardStats: (...args: unknown[]) => getDashboardStatsMock(...args),
}));

describe("GET /api/dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 when auth has no user", async () => {
    authMock.mockResolvedValue({ userId: null });

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDashboardStatsMock).not.toHaveBeenCalled();
  });

  it("returns 401 when auth times out", async () => {
    vi.useFakeTimers();
    authMock.mockReturnValue(new Promise(() => {}));

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const responsePromise = GET();

    await vi.advanceTimersByTimeAsync(1_001);
    const response = await responsePromise;

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDashboardStatsMock).not.toHaveBeenCalled();
  });

  it("returns stats payload when backend succeeds", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    getDashboardStatsMock.mockResolvedValue({
      continueWatching: null,
      completedTotal: 5,
      completedThisWeek: 2,
      streakDays: 3,
    });

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      continueWatching: null,
      completedTotal: 5,
      completedThisWeek: 2,
      streakDays: 3,
    });
    expect(getDashboardStatsMock).toHaveBeenCalledWith("user_1");
  });

  it("returns fallback payload when stats query times out", async () => {
    vi.useFakeTimers();
    authMock.mockResolvedValue({ userId: "user_2" });
    getDashboardStatsMock.mockReturnValue(new Promise(() => {}));

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const responsePromise = GET();

    await vi.advanceTimersByTimeAsync(901);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      continueWatching: null,
      completedTotal: 0,
      completedThisWeek: 0,
      streakDays: 0,
      isFallbackData: true,
    });
  });

  it("returns fallback payload when stats query throws", async () => {
    authMock.mockResolvedValue({ userId: "user_3" });
    getDashboardStatsMock.mockRejectedValue(new Error("db offline"));

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      continueWatching: null,
      completedTotal: 0,
      completedThisWeek: 0,
      streakDays: 0,
      isFallbackData: true,
    });
  });
});
