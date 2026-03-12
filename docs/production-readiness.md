# Production Readiness Checklist (Vercel)

## 0. Vercel Project Settings
- Import the GitHub repo into Vercel with the `Next.js` framework preset.
- The repo-level Vercel build command is pinned in `vercel.json`:
  - `pnpm vercel-build`
- `pnpm vercel-build` runs `pnpm prisma:generate`, then production readiness checks, then `pnpm build`.
- On Vercel production deployments, the readiness check runs in strict mode.

## 1. Environment and Secrets
- Configure these Vercel Production env vars:
  - `DATABASE_URL` (pooled runtime URL)
  - `DIRECT_URL` (direct DB URL) or `MIGRATE_DATABASE_URL`
  - `NEXT_PUBLIC_APP_URL` (https production URL, optional if `VERCEL_PROJECT_PRODUCTION_URL` is available)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_*`)
  - `CLERK_SECRET_KEY` (`sk_live_*`)
  - `ADMIN_EMAILS`, `TEACHER_EMAILS`
- Configure matching Preview env vars if you use preview deployments.
- Use a separate preview database if preview deployments will touch Prisma migrations.
- Confirm Clerk redirect/callback URLs include:
  - `/sign-in`
  - `/post-auth`
  - `/teach`
  - `/admin/teach`

## 2. Database and Migrations
- Keep runtime traffic on pooled DB URL (`DATABASE_URL`).
- Run Prisma migrations against direct DB URL:
  - `MIGRATE_DATABASE_URL='postgresql://...' pnpm migrate:deploy:direct`
- Verify migration state:
  - `pnpm prisma migrate status`

## 3. Build and Test Release Gates
- Required gates before deploy:
  - `pnpm vercel-build` (Vercel-equivalent production build path)
  - `pnpm release:verify` (typecheck + unit tests + production build)
  - `pnpm readiness:check:strict` (strict env and config validation)
- Optional but recommended:
  - `pnpm test:e2e:public`
  - `pnpm test:e2e:auth-smoke` (with CI secrets)

## 4. Runtime Health and Resilience
- Liveness endpoint:
  - `GET /api/health` (basic app up)
- Readiness endpoint:
  - `GET /api/health/ready` (config + auth key sanity + DB query timeout check)
- Health routes bypass Clerk middleware to stay available during auth provider issues.
- Watch degraded-mode logs and fallback usage after deploy (`Data may be delayed` paths).

## 5. Observability and Alerting
- Add centralized monitoring (Sentry/Datadog/etc.) for:
  - API errors
  - DB timeout frequency
  - degraded-mode spikes
- Track key user journeys:
  - learner sign-in -> `/post-auth` -> `/dashboard`
  - teacher sign-in -> `/teach` and `/admin/teach`

## 6. Manual Post-Deploy Smoke
- Learner:
  - Sign in, open `/courses`, `/dashboard`, `/games`
  - Confirm page navigation stays under acceptable latency
- Teacher:
  - Open `/teach` and `/admin/teach`
  - Switch tabs (`Teach`, `Learners`, `Progress`, `Settings`)
  - Assign a mission and confirm assignment queue updates
- Admin:
  - Open admin course/lesson editors and save a no-op update
  - Confirm analytics endpoint returns data:
    - `GET /api/admin/teach/assignment-analytics`
