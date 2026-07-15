# Clerk Prisma Debug Checklist

## Primary Touchpoints

- Proxy middleware: `src/proxy.ts`
- Auth helpers and role resolution: `src/lib/server/auth.ts`
- Prisma bootstrap and timeouts: `src/lib/server/prisma.ts`
- Clerk webhook sync: `src/app/api/webhooks/clerk/route.ts`
- Health routes: `src/app/api/health/route.ts`, `src/app/api/health/ready/route.ts`
- Teacher access fallback: `src/lib/server/teach-access.ts`

## Diagnosis Order

1. Confirm whether `/api/health` responds.
2. Probe one affected protected route or page.
3. Check env assumptions: Clerk keys, webhook signing secret, `DATABASE_URL`, `DIRECT_URL`, `MIGRATE_DATABASE_URL`, `ADMIN_EMAILS`, `TEACHER_EMAILS`.
4. Inspect whether the bug is auth-state classification, role mapping, webhook sync drift, or DB timeout behavior.
5. Fix the shared helper or middleware edge rather than adding duplicate route logic.

## Verification

- Run `pnpm lint`.
- Run `pnpm build` when auth helpers, Prisma wiring, middleware, or webhooks change.
- Run `pnpm readiness:check` or `pnpm readiness:check:strict` when the issue affects deployment readiness.
- Probe `/api/health` and the affected route after the fix.
