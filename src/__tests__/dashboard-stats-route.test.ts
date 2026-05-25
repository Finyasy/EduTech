/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getDashboardStatsMock = vi.fn();
const ensureUserByIdWithTimeoutMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/server/data", () => ({
  getDashboardStats: (...args: unknown[]) => getDashboardStatsMock(...args),
}));

vi.mock("@/lib/server/auth", () => ({
  ensureUserByIdWithTimeout: (...args: unknown[]) =>
    ensureUserByIdWithTimeoutMock(...args),
  isLearnerRole: (role: string | null | undefined) => role === "STUDENT",
}));

describe("GET /api/dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureUserByIdWithTimeoutMock.mockResolvedValue({
      id: "user_1",
      role: "STUDENT",
    });
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

    await vi.advanceTimersByTimeAsync(1_501);
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
      mastery: { ai: 50, coding: 40, math: 60 },
    });

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      continueWatching: null,
      completedTotal: 5,
      completedThisWeek: 2,
      streakDays: 3,
      mastery: { ai: 50, coding: 40, math: 60 },
    });
    expect(getDashboardStatsMock).toHaveBeenCalledWith("user_1");
  });

  it("returns 403 when the authenticated user is not a learner", async () => {
    authMock.mockResolvedValue({ userId: "teacher_1" });
    ensureUserByIdWithTimeoutMock.mockResolvedValue({
      id: "teacher_1",
      role: "TEACHER",
    });

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(getDashboardStatsMock).not.toHaveBeenCalled();
  });

  it("returns fallback payload when learner lookup times out or is unavailable", async () => {
    authMock.mockResolvedValue({ userId: "user_2" });
    ensureUserByIdWithTimeoutMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      continueWatching: null,
      completedTotal: 0,
      completedThisWeek: 0,
      streakDays: 0,
      mastery: { ai: 0, coding: 0, math: 0 },
      isFallbackData: true,
    });
    expect(getDashboardStatsMock).not.toHaveBeenCalled();
  });

  it("returns fallback payload when stats query times out", async () => {
    vi.useFakeTimers();
    authMock.mockResolvedValue({ userId: "user_2" });
    getDashboardStatsMock.mockReturnValue(new Promise(() => {}));

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const responsePromise = GET();

    await vi.advanceTimersByTimeAsync(2_401);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      continueWatching: null,
      completedTotal: 0,
      completedThisWeek: 0,
      streakDays: 0,
      mastery: { ai: 0, coding: 0, math: 0 },
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
      mastery: { ai: 0, coding: 0, math: 0 },
      isFallbackData: true,
    });
  });
});
