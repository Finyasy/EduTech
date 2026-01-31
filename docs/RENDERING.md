# Rendering Performance Implementation Plan

This document translates the rendering‑slowdown findings into a concrete, time‑boxed plan. It focuses on **server render latency** and **per‑request work** in Next.js App Router pages.

## Goal

Reduce page render time by cutting redundant DB/auth work, enabling caching where safe, and avoiding forced dynamic rendering on public routes.

## Scope

- Public pages: `/` (home), `/courses`, `/courses/[courseId]`, `/courses/[courseId]/lessons/[lessonId]`
- Dashboard pages: `/dashboard`, `/games`, `/games/[gameId]`, `/profile`
  
## Success criteria

- Public pages render quickly without waiting on Clerk or DB when possible.
- Dashboard pages render in < 1.5s on a warm server with realistic data.
- “Cold” DB queries reduced to 1 per page whenever possible.
- Measurable improvement via server timing logs or simple `curl` timings.

---

## Phase 0 — Baseline & instrumentation (Day 1)

**Objective:** get a before/after comparison and confirm where latency is coming from.

Deliverables:
- Add temporary timing logs around:
  - `ensureUserWithTimeout`
  - `getDashboardStats`
  - `listCourses`, `getCourse`, `listLessons`, `listGames`, `getGameWithLevels`
- Run local timing checks for:
  - `GET /`
  - `GET /courses`
  - `GET /courses/:id`
  - `GET /dashboard`
  - `GET /games`

Acceptance:
- Each route has a “before” timing snapshot.
- Top 2 slowest operations are identified per route.

### Findings captured (latest run)

- `/courses` render time dominated by DB:
  - `listCourses` DB time ≈ **0.8s–2.4s**
  - Total `/courses` render ≈ **0.8s–2.5s**
- `/dashboard` is the hottest route:
  - Render time ≈ **6.2s** (proxy/compile were minimal)
- `/games` renders between **0.8s–2.1s**
- `/profile` renders between **0.7s–1.6s**

---

## Phase 1 — Remove redundant calls (Days 2–3)

**Objective:** eliminate duplicate DB calls within the same request.

Work items:
1. **Course detail page**
   - Avoid calling `getCourse` twice (once in `generateMetadata`, again in page).
   - Plan: use a shared cached fetch (`cache()` or `unstable_cache`) keyed by `courseId`.
2. **Game detail page**
   - Use only `getGameWithLevels` and derive the `game` from that result.
3. **Dashboard**
   - Confirm a single pass of stats; avoid any repeated computation in child components.

Acceptance:
- No route makes the same DB call twice per request.
- Measured reduction in server timings vs Phase 0.

---

## Phase 2 — Caching & static rendering (Days 4–6)

**Objective:** reduce DB dependency for public routes and stabilize render times.

Work items:
1. **Cache read‑only data**
   - Cache `listCourses`, `listGames`, `getCourse`, `listLessons`, `getGameWithLevels`.
   - Use `cache()` or `unstable_cache` with a short TTL (e.g., 60–300 seconds).
2. **Allow static rendering where safe**
   - Ensure public pages do not require `auth()` or `ensureUserWithTimeout`.
   - Keep the header “public” by default; move user‑specific UI to dashboard pages only.

Acceptance:
- Public pages render without auth.
- DB queries reduced to near‑zero for cached data.
- Page latency decreases for repeat visits.

---

## Phase 3 — Dashboard query optimization (Days 7–9)

**Objective:** reduce heavy DB work on personalized pages.

Work items:
1. **Optimize `getDashboardStats`**
   - Replace full completion scan with a grouped query (by date).
   - Collapse the two `count()` calls into a single SQL query with `FILTER`.
   - Optionally store a “streak summary” table or cached value.
2. **Short‑circuit for new users**
   - If no completions exist, return default stats early.

Acceptance:
- Dashboard render time improves with large datasets.
- DB query count and total DB time are reduced.

---

## Phase 4 — Prefetch & UX perception (Days 10–11)

**Objective:** speed up navigation and perceived responsiveness.

Work items:
1. **Re‑enable prefetch** for routes that are commonly visited and safe.
2. **Skeleton/placeholder** UI for sections that require auth/DB so the page doesn’t feel frozen.

Acceptance:
- Navigation feels snappy even when backend work is still ongoing.

---

## Phase 5 — Verification & rollout (Day 12)

**Objective:** confirm improvements and lock in the gains.

Deliverables:
- After‑timing report vs Phase 0.
- A short “performance regression checklist” for future changes.

Acceptance:
- Public routes consistently respond under 500ms on warm dev server.
- Dashboard routes under 1.5s on warm dev server.

---

## Risks & mitigations

- **Caching stale content**: use short TTL and invalidate on admin writes.
- **Auth‑gated UI differences**: isolate auth‑dependent UI to dashboard routes.
- **Performance regression**: keep lightweight timing logs in dev only.

---

## Ownership & sequencing

- Phases 0–2 can be done immediately and independently.
- Phase 3 requires DB query attention and should be scheduled after caching is stable.
- Phase 4 is optional but improves perceived performance.

---

## Summary

This plan prioritizes quick wins (duplicate calls + caching) before deeper query optimization. With modest code changes in the data layer and a clearer split between public and authenticated UI, the app’s rendering should feel fast and consistent.

## Implementation update: dashboard hotspot (latest)

Applied the first dashboard optimization:
- **`getDashboardStats` now uses a single SQL query for counts** (total + this week).
- **Streak computation now uses distinct completion dates** instead of loading every completion row.

Next recommended step:
- Add a short‑TTL cache for `getDashboardStats` keyed by userId (e.g., 30–60s) if real‑time accuracy is not critical.

## Implementation update: cache invalidation + early return

- **Per‑user cache tag** added: `dashboard-stats:{userId}` with a 60s TTL.
- **Invalidate on progress updates**: `/api/progress` now calls `revalidateTag` so dashboards refresh quickly after lesson updates.
- **Early return for new users**: skip the date query when `completedTotal` is 0.

## Latest measurement (after dashboard cache)

Signed‑in `/dashboard` timings observed in dev:
- **~3.0s render time** for two back‑to‑back requests.

Notes:
- The 60s per‑user cache is now in place, but Next’s dev server can still re‑compute (cache behavior is less consistent in dev). A production build is the best place to confirm cache hits.
- To validate cache effectiveness, run a production build and test:
  - `pnpm build && pnpm start`
  - Hit `/dashboard` twice; the second request should be noticeably faster.

### Production validation (reported)

- First `/dashboard` load: **~1.07s**
- Second `/dashboard` load: **~2.78s**

Notes:
- The second load being slower is unexpected for a warm cache. This can happen if the second request includes additional data fetches (client transitions/RSC refetch) or if the measurement captured a background refresh. Re‑test with a full page reload twice and compare.

## Cache hit verification (prod‑mode)

Use a temporary debug flag to log cache misses from `getDashboardStats`:

1. Start prod with logging enabled:

```bash
DEBUG_CACHE=1 pnpm start
```

2. Hit `/dashboard` twice.
3. Check the server log:
   - **If you see only one** `[cache-miss] getDashboardStats` line, the second request was served from cache.
   - **If you see two**, the cache is missing (or being bypassed) and needs investigation.
