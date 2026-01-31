import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    expect(cn("base", false && "hidden", "active")).toBe("base active");
  });

  it("dedupes tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
