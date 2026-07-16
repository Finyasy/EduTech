/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyWebhookMock = vi.fn();
const getPrismaMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: (...args: unknown[]) => verifyWebhookMock(...args),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => getPrismaMock(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

describe("Clerk webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@example.com";
    process.env.TEACHER_EMAILS = "teacher@example.com";
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test";
  });

  it("upserts the user and revalidates the user cache tag", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.updated",
      data: {
        id: "user_1",
        first_name: "Ada",
        last_name: "Lovelace",
        primary_email_address_id: "email_1",
        email_addresses: [{ id: "email_1", email_address: "teacher@example.com" }],
      },
    });
    const upsertMock = vi.fn().mockResolvedValue({});
    getPrismaMock.mockReturnValue({
      user: { upsert: upsertMock },
    });

    const { POST } = await import("@/app/api/webhooks/clerk/route");
    const response = await POST(new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
    }) as never);

    expect(response.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledOnce();
    expect(revalidateTagMock).toHaveBeenCalledWith("user:user_1", { expire: 0 });
  });

  it("returns 503 when the user sync write times out", async () => {
    vi.useFakeTimers();
    verifyWebhookMock.mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "Ada",
        last_name: "Lovelace",
        primary_email_address_id: "email_1",
        email_addresses: [{ id: "email_1", email_address: "teacher@example.com" }],
      },
    });
    getPrismaMock.mockReturnValue({
      user: { upsert: vi.fn().mockReturnValue(new Promise(() => {})) },
    });

    const { POST } = await import("@/app/api/webhooks/clerk/route");
    const responsePromise = POST(new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
    }) as never);

    await vi.advanceTimersByTimeAsync(3_001);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Database request timed out",
    });
  });
});
