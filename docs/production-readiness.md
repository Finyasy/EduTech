# Production Readiness Checklist

## Authentication (Clerk)
- Use Clerk production keys (`pk_live_*`, `sk_live_*`) in production.
- Confirm `/sign-in`, `/post-auth`, `/teach`, and `/admin/teach` redirect URLs in Clerk dashboard.
- Remove `NEXT_PUBLIC_CLERK_DISABLE_SOCIAL=1` unless intentionally disabling social login.

## Application URLs
- Set `NEXT_PUBLIC_APP_URL` to your deployed domain (for consistent redirects and links).
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are defined in production env.

## Database
- Ensure `DATABASE_URL` uses a pooled production connection string.
- Check Neon/Prisma connection limits and timeouts (pool size, connection timeout, statement timeout).
- Run Prisma migrations before deploying app changes that depend on schema updates.

## Reliability / Monitoring
- Review fallback usage (`Data may be delayed`) in logs after deploy.
- Add centralized error monitoring (Sentry or equivalent) for API route failures and degraded-mode frequency.
- Monitor `/api/dashboard/stats`, `/api/teach/workspace`, and games/courses pages for timeout rates.

## Testing / CI
- Run `pnpm test:run` and Playwright smoke tests before release.
- Configure CI secrets for teacher/learner e2e credentials if you want authenticated smoke tests in CI.

## Manual Smoke Checks
- Student: sign in -> `/post-auth` -> `/dashboard`.
- Teacher: sign in -> `/teach` and `/admin/teach`.
- Teacher assignments: assign mission from `Teach` alignment panel and verify queue updates.
- Courses: verify age-band sections and mission detail pages render.
