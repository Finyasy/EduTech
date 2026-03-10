/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { games as mockGames } from "@/lib/server/mock-data";

const originalDatabaseUrl = process.env.DATABASE_URL;

function mockDbUrl() {
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/edutech";
}

describe("listGames fallback edge cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    mockDbUrl();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("falls back to mock games when DB query throws", async () => {
    const prismaMock = {
      game: {
        findMany: vi.fn().mockRejectedValue(new Error("connection timeout")),
      },
    };

    vi.doMock("@/lib/server/prisma", () => ({
      getPrisma: () => prismaMock,
    }));

    const { listGames } = await import("@/lib/server/data");
    const result = await listGames();

    expect(prismaMock.game.findMany).toHaveBeenCalledOnce();
    expect(result).toHaveLength(mockGames.length);
    expect(result.every((game) => game.isFallbackData === true)).toBe(true);
  });

  it("falls back to mock games when DB query exceeds timeout", async () => {
    vi.useFakeTimers();

    const prismaMock = {
      game: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    };

    vi.doMock("@/lib/server/prisma", () => ({
      getPrisma: () => prismaMock,
    }));

    const { listGames } = await import("@/lib/server/data");
    const resultPromise = listGames();

    await vi.advanceTimersByTimeAsync(2201);
    const result = await resultPromise;

    expect(prismaMock.game.findMany).toHaveBeenCalledOnce();
    expect(result).toHaveLength(mockGames.length);
    expect(result.every((game) => game.isFallbackData === true)).toBe(true);
  });
});
