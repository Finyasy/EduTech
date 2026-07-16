# Localhost Hang Recommendations

This document summarizes how to diagnose and fix the `http://localhost:3000/` request hang observed during local development.

## Current Finding

The dev server was listening on port 3000, but app routes accepted connections without returning responses. The confirmed fix was:

1. Stop the existing dev server.
2. Restart with the default host binding:

```bash
pnpm dev
```

3. Fix malformed `.env` syntax so Clerk keys are parsed.
4. Confirm `/api/health` and `/` return 200.

Avoid starting the dev server with `--hostname 127.0.0.1` when Clerk middleware is enabled. In the latest incident, that host binding caused app routes to hang while static assets could still respond.

## Fast Diagnostic Path

Check whether anything is listening:

```bash
lsof -i :3000
```

Probe the home page:

```bash
curl -s -o /dev/null -w "HTTP %{http_code} time %{time_total}s\n" --connect-timeout 5 --max-time 10 http://localhost:3000/
```

Probe the simple health route:

```bash
curl -s -o /dev/null -w "health HTTP %{http_code} time %{time_total}s\n" --connect-timeout 3 --max-time 8 http://localhost:3000/api/health
```

Interpretation:

- If both `/` and `/api/health` time out with HTTP `000`, the likely shared failure point is middleware.
- If `/api/health` responds but `/` hangs, inspect the page/layout path, `SiteHeader`, Clerk user lookup, and DB calls.
- If nothing is listening, restart the dev server.

## Clerk Checklist

Verify the App Router setup before deeper debugging:

- `src/proxy.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server`.
- `src/middleware.ts` re-exports the proxy middleware and config so Next.js runs it.
- `src/app/layout.tsx` wraps the app with `<ClerkProvider>` when Clerk is configured.
- UI components come from `@clerk/nextjs`.
- Server auth helpers come from `@clerk/nextjs/server`.
- Real keys live only in `.env.local` or local untracked env files.
- `.env` syntax is valid, especially quoted values.

Do not use deprecated `authMiddleware()` or pages-router Clerk examples for this app.

## Other Causes To Check

Database:

- If only DB-backed pages hang, confirm `DATABASE_URL` reachability.
- Keep connection and statement timeouts in the Prisma/pg pool.
- Add or use a DB-aware readiness route for deployment checks.

Auth and user sync:

- Avoid unbounded `ensureUser()` calls in request paths.
- Prefer short timeouts for user lookup flows that should not block the full page.
- Move repeated user provisioning to Clerk webhooks where practical.

Request timeouts:

- Next.js and Node can hold a slow request open.
- Use bounded DB and auth calls in routes that affect first paint.

## Lessons Learned

- Probe an app route and an API route; static assets can hide middleware issues.
- Restart from a clean baseline before deep debugging.
- Host binding can affect middleware behavior in local dev.
- Env syntax errors can look like missing Clerk keys.
- A minimal `/api/health` route is useful because it isolates middleware from page code.

## References

- [CLERK_SETUP.md](../CLERK_SETUP.md)
- [Clerk Next.js quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard API keys](https://dashboard.clerk.com/last-active?path=api-keys)

