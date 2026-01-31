/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns ok true", async () => {
    const response = GET();
    const json = await response.json();

    expect(json).toEqual({ ok: true });
  });
});
