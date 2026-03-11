/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getPrismaMock = vi.fn();
const mutableEnv = process.env as Record<string, string | undefined>;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => getPrismaMock(),
}));

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe("teacher workspace snapshot cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
    process.env.DATABASE_URL = "postgresql://local/test";
    mutableEnv.NODE_ENV = "development";
  });

  afterEach(async () => {
    vi.useRealTimers();
    const degradedMode = await import("@/lib/server/degraded-mode");
    degradedMode.clearScopeDegraded("teacher-workspace");
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalNodeEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalNodeEnv;
    }
  });

  it("reuses the last live snapshot when a fresh workspace read times out", async () => {
    const createdAt = new Date("2026-03-11T00:00:00.000Z");

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockResolvedValue({
          schoolName: "Live School",
          country: "Kenya",
          appVersion: "4.1.0",
          deviceId: "lb-live",
          connectivityStatus: "OKAY",
          contentStatus: "UP_TO_DATE",
          supportEmail: "support@example.com",
          schoolQrCode: "LIVE-QR",
        }),
      },
      teacherClassroom: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "class-live",
            name: "Live Class",
            grade: "PP1",
            teacherName: "Mary",
            teacherPhone: "+254700000001",
            cardColor: "bg-sky-100",
            isArchived: false,
            createdAt,
            updatedAt: createdAt,
          },
        ]),
      },
      teacherLearner: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    });

    const { getTeacherWorkspaceSnapshot } = await import("@/lib/server/teacher-store");

    const liveSnapshot = await getTeacherWorkspaceSnapshot({
      ownerKey: "teacher_1",
    });

    expect(liveSnapshot.isFallbackData).toBe(false);
    expect(liveSnapshot.school.schoolName).toBe("Live School");
    expect(liveSnapshot.classes[0]?.id).toBe("class-live");

    await vi.advanceTimersByTimeAsync(6_000);

    getPrismaMock.mockReturnValue({
      teacherSchoolProfile: {
        findUnique: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      teacherClassroom: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      teacherLearner: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      teacherSessionStatus: {
        findMany: vi.fn().mockReturnValue(new Promise(() => {})),
      },
      $queryRaw: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    const staleSnapshotPromise = getTeacherWorkspaceSnapshot({
      ownerKey: "teacher_1",
    });

    await vi.advanceTimersByTimeAsync(4_001);
    const staleSnapshot = await staleSnapshotPromise;

    expect(staleSnapshot.isFallbackData).toBe(false);
    expect(staleSnapshot.school.schoolName).toBe("Live School");
    expect(staleSnapshot.classes[0]?.id).toBe("class-live");
  });
});
