# Why the App May Hang – Recommendations

This document explains why **http://localhost:3000/** may not work (request hangs), what was observed when diagnosing it, and what to do next. It also captures lessons learned from the latest incident and the exact fix that restored service.

---

## Why http://localhost:3000/ is not working

The dev server is running (Node is listening on port 3000), but **requests never complete**: the server accepts the connection but does not send a response, so the browser or `curl` eventually times out. So the issue is a **request hang**, not “server won’t start” or “connection refused.”

In the latest incident, the hang was caused by the dev server being started with an explicit host binding (`--hostname 127.0.0.1`) while Clerk middleware was enabled. With that host binding, **app routes** (like `/` and `/api/health`) stalled, while static assets (like `/favicon.ico`) still responded. Restarting the server with the **default host binding** (no `--hostname` flag) immediately resolved the hang.

Additionally, the message “Sign-in is not available until Clerk keys are added to .env.” was traced to a malformed `.env` file (missing a closing quote), which prevented Clerk keys from being read. Fixing the `.env` syntax and restarting removed that error.

---

## Diagnostic results (investigation)

The following commands were run to locate where the hang occurs.

### 1. Is anything listening on port 3000?

```bash
lsof -i :3000
```

**Result:** Yes. A `node` process (e.g. PID 49699) is listening on `localhost:3000` (shown as `hbci`). The Next.js dev server is up.

### 2. Does GET / respond?

```bash
curl -s -o /dev/null -w "HTTP %{http_code} time %{time_total}s\n" --connect-timeout 5 --max-time 10 http://localhost:3000/
```

**Result:** Connection succeeds, but **no HTTP response** within 10 seconds. Output: `HTTP 000 time 10.001673s` (exit 28 / timeout). So the home page request **hangs** before sending a response.

### 3. Does a simple API route respond?

```bash
curl -s -o /dev/null -w "health HTTP %{http_code} time %{time_total}s\n" --connect-timeout 3 --max-time 8 http://localhost:3000/api/health
```

**Result:** Same behavior: **no response** within 8 seconds. Output: `health HTTP 000 time 8.005200s` (timeout). The `/api/health` route is a trivial handler (returns JSON with no DB or Clerk calls).

### 4. What do these two have in common?

- **Middleware:** Both `/` and `/api/health` are matched by the middleware in `src/proxy.ts` / `src/middleware.ts`:
  - The matcher includes `"/(api|trpc)(.*)"`, so **every** `/api/*` request goes through `clerkMiddleware()`.
  - The first matcher also covers `/`.
- So **every request** to the app (including `/` and `/api/health`) runs **Clerk middleware** before any page or API handler runs.

### Conclusion from diagnostics

Because **both** the home page and a minimal API route hang, and the only shared code path is **middleware**, the hang is very likely in **Clerk middleware** (`clerkMiddleware()`), not in the database, `ensureUser()`, or the page/layout for `/`.

Likely sequence: request arrives → Next.js runs `clerkMiddleware()` → middleware calls Clerk’s backend (e.g. to validate session) → that call blocks or is very slow (network/outage/config) → request never proceeds to the route handler, so **http://localhost:3000/** never gets a response.

In the latest fix, this specific hang was eliminated by **starting the dev server without `--hostname 127.0.0.1`** (default host binding). With the default host, both `/` and `/api/health` returned 200 immediately.

---

## Clerk implementation checklist (when diagnosing Clerk-related hangs)

If the diagnostic above points to **Clerk middleware** as the cause, verify that the app follows the **current** Clerk + Next.js App Router setup. Incorrect or outdated implementation can break the auth flow and contribute to hangs. Use this checklist (aligned with the project’s **CLERK_SETUP.md** and [Clerk Next.js quickstart](https://clerk.com/docs/quickstarts/nextjs)):

### Required for correct implementation

1. **Middleware**
   - **Use `clerkMiddleware()`** from `@clerk/nextjs/server` (not `authMiddleware()` — that is deprecated).
   - **Config lives in `proxy.ts`** (in `src/` if the project uses `src/`), with `export default clerkMiddleware()` and the standard `config.matcher` (skip `_next` and static assets; run for API routes).
   - **Next.js only runs a file named `middleware.ts`** (at root or in `src/`). So you need either:
     - `src/middleware.ts` (or root `middleware.ts`) that **re-exports** from `proxy.ts` (e.g. `export { default, config } from "./proxy";`), or
     - All middleware logic in `middleware.ts` itself.
   - If `proxy.ts` exists but there is no `middleware.ts` that runs it, **middleware never runs**; if you later add `middleware.ts` and both `/` and `/api/health` hang, the hang is in Clerk middleware.

2. **Layout**
   - **Wrap the app with `<ClerkProvider>`** in `app/layout.tsx` (or `src/app/layout.tsx`). The root layout should render `<ClerkProvider>` around `<html>`/`<body>` and children.
   - Use Clerk components in the layout or pages: `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignedIn>`, `<SignedOut>` from `@clerk/nextjs`.

3. **Imports**
   - **Server-only APIs** (e.g. `auth()`, `clerkClient()`) must be imported from `@clerk/nextjs/server`.
   - **UI components** from `@clerk/nextjs`.
   - Use **async/await** with `auth()` (e.g. `const { userId } = await auth();`). Do not use deprecated APIs (`withAuth`, old `currentUser` patterns, etc.).

4. **Environment variables**
   - **Real keys only in `.env.local`** (never in app code or tracked files). Use the [Clerk Dashboard API keys](https://dashboard.clerk.com/last-active?path=api-keys): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
   - **Verify `.gitignore`** excludes `.env*` so real keys are not committed.
   - In docs or snippets, use **placeholders only** (e.g. `YOUR_PUBLISHABLE_KEY`, `YOUR_SECRET_KEY`).

### What to avoid (outdated patterns)

- **Do not** use `authMiddleware()` — it is replaced by `clerkMiddleware()`.
- **Do not** put Clerk config in `_app.tsx` or a **pages/**-based structure; use the **App Router** (`app/` directory).
- **Do not** rely on old sign-in/sign-up paths under `pages/signin.js` etc.; use App Router routes and Clerk’s `<SignIn />` / `<SignUp />` components.

If any of the required items are missing or an outdated pattern is present, fix the implementation first; then re-run the hang diagnostics. See **CLERK_SETUP.md** in the project root for the full guardrails and quickstart sample.

---

## Likely causes (by area)

The sections below describe possible contributors to hangs. The **diagnostic above** points to **middleware (Clerk)** as the main cause when both `/` and `/api/health` hang.

---

## 1. Clerk middleware (high impact) — **primary suspect from diagnostics**

**Cause:** `clerkMiddleware()` runs on every request that matches the matcher. If Clerk’s backend is slow or unreachable (network, outage, invalid keys), the middleware can block the request with no application-level timeout. The request never reaches the page or API route.

**Evidence:** `src/proxy.ts` / `src/middleware.ts` use `clerkMiddleware()` with no timeout wrapper. The matcher covers both `/` and `/(api|trpc)(.*)`, so `/api/health` also goes through Clerk. **Diagnostic:** Both `GET /` and `GET /api/health` hang; the only shared path is middleware.

**Recommendations:**

- **Verify Clerk implementation** against the **Clerk implementation checklist** above (correct `clerkMiddleware()` in `proxy.ts`, `middleware.ts` re-export so Next.js runs it, layout with `<ClerkProvider>`, imports from `@clerk/nextjs` / `@clerk/nextjs/server`, keys only in `.env.local`). See **CLERK_SETUP.md** and [Clerk Next.js quickstart](https://clerk.com/docs/quickstarts/nextjs).
- Verify Clerk env vars in `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) match the [Clerk Dashboard API keys](https://dashboard.clerk.com/last-active?path=api-keys) and that the Clerk application is reachable (no firewall/VPN blocking).
- Confirm network access from the dev machine to Clerk’s API (e.g. `curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://api.clerk.com` or the URL your SDK uses).
- If the hang stops when middleware is bypassed (e.g. exclude `/api/health` from the matcher temporarily), the cause is Clerk middleware.
- Consider excluding a health route from the Clerk matcher so `/api/health` can respond without going through Clerk (useful for load balancers and local diagnostics).
- **Operational fix (confirmed):** run `pnpm dev` without `--hostname 127.0.0.1`. In the latest incident, the host flag caused hanging responses under Clerk middleware; the default host (0.0.0.0) immediately restored responses.
- **Configuration fix (confirmed):** ensure `.env` keys are valid if you choose to put them there. A missing closing quote caused Clerk to report missing keys.

---

## 2. Database connection (high impact)

**Cause:** The first time `getPrisma()` runs, it creates a `pg` Pool. If `DATABASE_URL` points to a host that is unreachable, slow, or behind a firewall, the Pool can wait indefinitely for a TCP connection (no built-in timeout).

**Evidence:** `src/lib/server/prisma.ts` previously created the Pool with only `connectionString`; no `connectionTimeoutMillis` or `statement_timeout`. **Note:** If the hang were in the DB, `/api/health` (which does not use the DB) would still respond; since `/api/health` also hangs, DB is less likely the cause when both `/` and `/api/health` hang.

**Recommendations:**

- Add `connectionTimeoutMillis: 10_000` and `statement_timeout: 15_000` to the Pool config so connection attempts and queries do not hang indefinitely.
- Optional: Add a health check that pings the DB and returns 503 if it times out.

---

## 3. Auth and user sync on every page (medium impact)

**Cause:** The home page and any page that renders `SiteHeader` run `ensureUser()` (via `safeEnsureUser(1500)` in the header). That calls:

1. `auth()` (Clerk)
2. `clerkClient()` then `client.users.getUser(userId)` (Clerk API)
3. `prisma.user.upsert(...)` (DB)

If any of these are slow or hang, the page can feel stuck. The header already uses a 1.5s timeout; other callers do not.

**Evidence:**

- `src/components/shared/SiteHeader.tsx`: uses `safeEnsureUser(1500)` – good.
- `src/app/(dashboard)/dashboard/page.tsx`: uses `await ensureUser()` with **no timeout** – can hang if Clerk or DB is slow.
- `src/lib/server/auth.ts` `requireAdmin()`: uses `await ensureUser()` with no timeout – admin API routes can hang.

**Recommendations:**

- Use a shared “safe” wrapper (e.g. `safeEnsureUser(timeoutMs)`) wherever you call `ensureUser()` from a page or long-running flow, and use a short timeout (e.g. 2–3s).
- In the dashboard page, call something like `safeEnsureUser(3000)` instead of raw `ensureUser()` so a slow Clerk/DB doesn’t hang the dashboard.
- For admin API routes, either use the same safe wrapper or enforce a global request timeout (e.g. in a wrapper or at the platform level).

---

## 4. ClerkProvider and layout (lower impact)

**Cause:** Wrapping the app in `<ClerkProvider>` can do work on first load (e.g. reading session). If Clerk’s CDN or API is slow, first paint can be delayed. Usually this is seconds, not a full hang.

**Recommendations:**

- Keep the existing conditional: only render `ClerkProvider` when Clerk keys are configured.
- If you still see long freezes on first load, consider loading Clerk only when needed (e.g. dynamic import of a layout that uses `ClerkProvider`) so the rest of the app can render first.

---

## 5. No request-level timeout (medium impact)

**Cause:** Next.js and Node don’t enforce a global request timeout. A single slow `auth()`, `getUser()`, or Prisma call can hold the request open until the client or proxy times out (often 30–60+ seconds).

**Recommendations:**

- Rely on the **DB timeouts** (connection + statement) already added.
- Use **time-bounded `ensureUser()`** (e.g. `safeEnsureUser(2000)`) in all pages and routes that call it.
- Optionally add a server-level timeout (e.g. in a custom server or platform config) so no request runs longer than e.g. 30s.

---

## 6. Summary of changes made in code

| Area              | Change |
|-------------------|--------|
| **Prisma / pg**   | In `src/lib/server/prisma.ts`, Pool now uses `connectionTimeoutMillis: 10_000` and `statement_timeout: 15_000`. |
| **SiteHeader**    | Already uses `safeEnsureUser(1500)` – no change. |
| **Dashboard**     | Recommended: switch to `safeEnsureUser(3000)` (or similar) instead of `ensureUser()` so dashboard doesn’t hang. |
| **Admin / API**   | Recommended: use `safeEnsureUser(...)` or a route-level timeout where `ensureUser()` is used. |

Note: The **operational fix** for the latest hang did **not** require code changes. It was resolved by:
- Restarting the dev server **without** `--hostname 127.0.0.1`.
- Fixing a malformed `.env` line so Clerk keys were read.

---

## 7. How to confirm where it hangs (diagnostic procedure)

Use these steps to narrow down the cause without changing app logic.

### Step 1: Confirm the server is running

```bash
lsof -i :3000
```

- If nothing is listed, the dev server is not running; start it with `pnpm dev`.
- If `node` is listening on port 3000, the server is up; the issue is that **requests hang** (no response).

If the server is up but requests hang, check whether it was launched with `--hostname 127.0.0.1`. If so, restart with:

```bash
pnpm dev
```

This uses the default host binding and avoids the hang observed with Clerk middleware.

### Step 2: Probe the home page

```bash
curl -s -o /dev/null -w "HTTP %{http_code} time %{time_total}s\n" --connect-timeout 5 --max-time 10 http://localhost:3000/
```

- **HTTP 200** and short time: home page is fine; look at other URLs or actions.
- **HTTP 000** and time ≈ 10s: request timed out; the server accepted the connection but never sent a response (hang).

### Step 3: Probe a simple API route (no auth, no DB)

```bash
curl -s -o /dev/null -w "health HTTP %{http_code} time %{time_total}s\n" --connect-timeout 3 --max-time 8 http://localhost:3000/api/health
```

- **HTTP 200** and short time: the hang is **not** in middleware (middleware runs for all matched routes). The hang is likely in the **page/layout path** for `/` (e.g. layout, SiteHeader, ensureUser, or DB).
- **HTTP 000** and timeout: the hang is in a **path shared by both `/` and `/api/health`**. The only shared path is **middleware** (`clerkMiddleware()`). So the hang is very likely in **Clerk middleware** (Clerk backend slow/unreachable or invalid config).

### Step 4: Check middleware matcher and Clerk implementation

Inspect `src/proxy.ts` (or `src/middleware.ts`). The matcher determines which requests run Clerk middleware. If the matcher includes both `/` and `/(api|trpc)(.*)`, then both the home page and `/api/health` go through Clerk. Use that to interpret Step 2 and Step 3.

If the hang points to Clerk middleware, verify the **Clerk implementation checklist** above: `clerkMiddleware()` (not `authMiddleware()`) in `proxy.ts`, `middleware.ts` present and re-exporting so Next.js runs it, `<ClerkProvider>` in root layout, keys in `.env.local` only. See **CLERK_SETUP.md** for the full setup.

### Step 5: Optional – narrow with logging

Add short log lines (with timestamps) at the start of:

- middleware,
- layout (before/after ClerkProvider),
- SiteHeader (before/after `ensureUserWithTimeout`),
- `ensureUser()` (before `auth()`, before `getUser`, before `upsert`),
- `getPrisma()` / first DB call.

Reproduce the hang; the **last log line before silence** is the approximate hang point.

### Step 6: Optional – isolate Clerk vs DB

- **DB:** Run `pnpm prisma studio` or a small script that uses `getPrisma()` and a simple query; if that hangs, the issue is DB/network. (If `/api/health` already responded in Step 3, DB is less likely the cause for the home-page hang.)
- **Clerk:** Temporarily exclude `/api/health` from the Clerk matcher or disable Clerk (e.g. make `isClerkConfigured()` return false); if the hang stops or `/api/health` starts responding, the issue is likely Clerk middleware or Clerk-backed code.

---

## Lessons learned (from the latest incident)

1. **Host binding matters with middleware.** Starting Next dev with `--hostname 127.0.0.1` caused requests to hang when Clerk middleware was enabled. The server accepted connections but never returned responses for app routes. Running with the default host binding fixed it immediately.
2. **Static assets can be misleading.** `/favicon.ico` returned 200 even when `/` and `/api/health` hung. Always probe at least one **app route** and one **API route**.
3. **Env file syntax errors surface as auth UX issues.** A missing closing quote in `.env` caused Clerk to report missing keys even though keys were present. Always validate `.env` syntax when Clerk reports “keys missing.”
4. **Minimal health checks are essential.** A trivial `/api/health` endpoint helped confirm that the hang happened before routes executed, pointing back to middleware.
5. **Restart with a clean baseline first.** Before deeper debugging, stop all `next dev` processes, remove `.next/` if needed, and start a single dev server with the default host binding.

## What fixed it (latest incident)

1. **Restarted** the dev server using `pnpm dev` (no `--hostname` flag).
2. **Corrected** `.env` syntax to ensure Clerk keys are parsed.
3. **Confirmed** responses: `/api/health` and `/` returned 200.


---

**Summary:** When both `GET /` and `GET /api/health` time out with HTTP 000, the diagnostic points to **Clerk middleware** as the cause. Fix Clerk implementation first (checklist above and **CLERK_SETUP.md**), then Clerk config/network (keys, reachability); then consider excluding health from the matcher or adding timeouts if needed.

---

## References (implementation)

- **CLERK_SETUP.md** (project root) — Guardrails and correct Clerk + Next.js App Router setup for this project; use for verification and quickstart sample.
- [Clerk Next.js quickstart](https://clerk.com/docs/quickstarts/nextjs) — Official, up-to-date integration steps (install `@clerk/nextjs`, `proxy.ts` with `clerkMiddleware()`, layout with `<ClerkProvider>`, `.env.local` keys).
- [Clerk Dashboard API keys](https://dashboard.clerk.com/last-active?path=api-keys) — Where to copy Publishable Key and Secret Key for `.env.local`.
