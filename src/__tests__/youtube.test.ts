import { describe, expect, it } from "vitest";
import {
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  normalizeYouTubeVideoId,
} from "@/lib/youtube";

describe("normalizeYouTubeVideoId", () => {
  it("accepts a plain YouTube ID", () => {
    expect(normalizeYouTubeVideoId("M7lc1UVf-VE")).toBe("M7lc1UVf-VE");
  });

  it("extracts an ID from a watch URL", () => {
    expect(
      normalizeYouTubeVideoId("https://www.youtube.com/watch?v=ysz5S6PUM-U"),
    ).toBe("ysz5S6PUM-U");
  });

  it("extracts an ID from a short URL", () => {
    expect(normalizeYouTubeVideoId("https://youtu.be/aqz-KE-bpKQ")).toBe(
      "aqz-KE-bpKQ",
    );
  });

  it("normalizes known legacy IDs", () => {
    expect(normalizeYouTubeVideoId("mC6Y9xq-0RA")).toBe("M7lc1UVf-VE");
  });

  it("returns null for invalid values", () => {
    expect(normalizeYouTubeVideoId("invalid video id")).toBeNull();
    expect(normalizeYouTubeVideoId("")).toBeNull();
  });
});

describe("YouTube URL builders", () => {
  it("builds embed and watch URLs", () => {
    expect(getYouTubeEmbedUrl("M7lc1UVf-VE")).toBe(
      "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
    );
    expect(getYouTubeWatchUrl("M7lc1UVf-VE")).toBe(
      "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    );
  });
});
