const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const LEGACY_VIDEO_ID_REMAP: Record<string, string> = {
  "mC6Y9xq-0RA": "M7lc1UVf-VE",
  "8qjV4yjiBrg": "ysz5S6PUM-U",
  "hEV6G2-15R4": "aqz-KE-bpKQ",
  "4lkds9NL2qg": "M7lc1UVf-VE",
  "t2D1dGyG2A0": "ysz5S6PUM-U",
  "nV0qKMh8Yx4": "aqz-KE-bpKQ",
};

const toNormalizedHost = (host: string) =>
  host.toLowerCase().replace(/^www\./, "");

const readVideoIdFromUrl = (url: URL) => {
  const host = toNormalizedHost(url.hostname);

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const [kind, id] = segments;
      if (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") {
        return id;
      }
    }
  }

  if (host === "youtube-nocookie.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && segments[0] === "embed") {
      return segments[1];
    }
  }

  return null;
};

const toUrlCandidate = (value: string) => {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("youtube.com/") ||
    value.startsWith("www.youtube.com/") ||
    value.startsWith("m.youtube.com/") ||
    value.startsWith("youtu.be/") ||
    value.startsWith("youtube-nocookie.com/")
  ) {
    return value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
  }

  return null;
};

const toValidatedVideoId = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return LEGACY_VIDEO_ID_REMAP[trimmed] ?? trimmed;
  }

  return null;
};

export const normalizeYouTubeVideoId = (value: string | null | undefined) => {
  const direct = toValidatedVideoId(value);
  if (direct) {
    return direct;
  }

  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const urlCandidate = toUrlCandidate(trimmed);
  if (!urlCandidate) {
    return null;
  }

  try {
    const url = new URL(urlCandidate);
    const fromUrl = readVideoIdFromUrl(url);
    return toValidatedVideoId(fromUrl);
  } catch {
    return null;
  }
};

export const getYouTubeEmbedUrl = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}`;

export const getYouTubeWatchUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;
