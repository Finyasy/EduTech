type DegradedEntry = {
  until: number;
  reason: string;
};

const DEFAULT_DEGRADED_TTL_MS = 15_000;
const FALLBACK_SPIKE_WINDOW_MS = 60_000;
const FALLBACK_SPIKE_THRESHOLD = 5;
const ALERT_COOLDOWN_MS = 60_000;

const globalStore = globalThis as typeof globalThis & {
  __edutechDegradedScopes?: Map<string, DegradedEntry>;
  __edutechDegradedFallbackHistory?: Map<string, number[]>;
  __edutechDegradedLastAlertAt?: Map<string, number>;
};

const scopes = globalStore.__edutechDegradedScopes ?? new Map<string, DegradedEntry>();
if (!globalStore.__edutechDegradedScopes) {
  globalStore.__edutechDegradedScopes = scopes;
}
const fallbackHistory =
  globalStore.__edutechDegradedFallbackHistory ?? new Map<string, number[]>();
if (!globalStore.__edutechDegradedFallbackHistory) {
  globalStore.__edutechDegradedFallbackHistory = fallbackHistory;
}
const lastAlertAt = globalStore.__edutechDegradedLastAlertAt ?? new Map<string, number>();
if (!globalStore.__edutechDegradedLastAlertAt) {
  globalStore.__edutechDegradedLastAlertAt = lastAlertAt;
}

export function isScopeDegraded(scope: string) {
  const entry = scopes.get(scope);
  if (!entry) return false;
  if (entry.until <= Date.now()) {
    scopes.delete(scope);
    return false;
  }
  return true;
}

export function markScopeDegraded(scope: string, reason: string, ttlMs = DEFAULT_DEGRADED_TTL_MS) {
  scopes.set(scope, { until: Date.now() + ttlMs, reason });
  const now = Date.now();
  const existing = fallbackHistory.get(scope) ?? [];
  const recent = existing.filter((time) => now - time <= FALLBACK_SPIKE_WINDOW_MS);
  recent.push(now);
  fallbackHistory.set(scope, recent);

  const lastAlert = lastAlertAt.get(scope) ?? 0;
  if (
    recent.length >= FALLBACK_SPIKE_THRESHOLD &&
    now - lastAlert >= ALERT_COOLDOWN_MS
  ) {
    console.warn(
      `[degraded-mode] fallback spike detected for scope=${scope} count=${recent.length} windowMs=${FALLBACK_SPIKE_WINDOW_MS} reason=${reason}`,
    );
    lastAlertAt.set(scope, now);
  }
}

export function clearScopeDegraded(scope: string) {
  scopes.delete(scope);
}

export function getDegradedScopeReason(scope: string) {
  const entry = scopes.get(scope);
  if (!entry) return null;
  if (entry.until <= Date.now()) {
    scopes.delete(scope);
    return null;
  }
  return entry.reason;
}

export function getDegradedFallbackRecentCount(scope: string) {
  const now = Date.now();
  const history = fallbackHistory.get(scope) ?? [];
  const recent = history.filter((time) => now - time <= FALLBACK_SPIKE_WINDOW_MS);
  if (recent.length !== history.length) {
    fallbackHistory.set(scope, recent);
  }
  return recent.length;
}
