# EduTech

EduTech is a gamified learning platform for logic and mathematics. Students learn through interactive challenges, mini-games, and curated educational videos, with progress tracking and skill mastery.

## What’s included

- Course and lesson catalog with published/unpublished controls
- Lesson videos, notes, and quizzes (multiple choice + short answer)
- Game catalog with levels, attempts, and best scores
- Student progress tracking (continue watching, streaks, completions)
- Admin workflows for creating/editing courses and lessons
- Mock data fallback when the database isn’t configured

## Tech stack

- Next.js 16 (App Router)
- React 19
- Prisma + PostgreSQL
- Clerk authentication
- Tailwind CSS

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (optional for local development)

### Install

```bash
pnpm install
```

### Environment variables

Create a `.env.local` with the following values:

```bash
# Database (optional; required for admin + persistence)
DATABASE_URL="postgresql://USER:PASSWORD@POOLER_HOST:5432/DB"

# Direct DB URL for Prisma migrate/seed (recommended for Neon)
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_HOST:5432/DB"

# Optional explicit override for migrate/seed commands
MIGRATE_DATABASE_URL="postgresql://USER:PASSWORD@DIRECT_HOST:5432/DB"

# Clerk (required for auth UI)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Comma-separated list of admin emails
ADMIN_EMAILS="admin@example.com,other@example.com"

# Comma-separated list of teacher emails
TEACHER_EMAILS="teacher@example.com,other-teacher@example.com"
```

Notes:
- If `DATABASE_URL` is not set, the app serves mock data for courses, lessons, and games.
- Admin pages require both `DATABASE_URL` and a user whose email appears in `ADMIN_EMAILS`.
- Teacher workspace requires a signed-in staff account when DB is configured:
  - `ADMIN_EMAILS` -> Admin role
  - `TEACHER_EMAILS` -> Teacher role
- Prisma migrate/seed uses `MIGRATE_DATABASE_URL` if set, otherwise `DIRECT_URL`, then `DATABASE_URL`.

### Prisma (optional)

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
```

### Run locally

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` — production build
- `pnpm vercel-build` — Prisma generate, readiness gate, then Vercel-equivalent production build
- `pnpm start` — start production server
- `pnpm lint` — run ESLint
- `pnpm prisma` — Prisma CLI
- `pnpm prisma:generate` — generate Prisma client
- `pnpm prisma:migrate` — run migrations
- `pnpm prisma:studio` — open Prisma Studio
- `pnpm db:seed` — seed the database
- `pnpm readiness:check` — verify production env and deployment readiness
- `pnpm readiness:check:strict` — strict readiness gate (fails on warnings)
- `pnpm release:verify` — typecheck, unit tests, and production build

## Project structure

- `src/app` — routes, pages, and API endpoints
- `src/components` — shared UI components
- `src/lib` — server helpers and utilities
- `prisma` — schema, migrations, and seed script
- `public` — static assets

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Keep the framework preset as `Next.js`.
3. The repo now pins the Vercel build command in `vercel.json`:
   - `pnpm vercel-build`
   - This runs `pnpm prisma:generate`, then production readiness checks, then `pnpm build`.
   - Production Vercel deploys run readiness in strict mode.
4. Configure environment variables in Vercel for both `Production` and `Preview` as needed:
   - `DATABASE_URL` (pooled runtime URL)
   - `DIRECT_URL` (direct DB URL) or `MIGRATE_DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL` (your production URL, optional if you rely on `VERCEL_PROJECT_PRODUCTION_URL`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_*` in production)
   - `CLERK_SECRET_KEY` (`sk_live_*` in production)
   - `ADMIN_EMAILS`, `TEACHER_EMAILS`
5. Use a separate preview database if you want preview deployments to run Prisma migrations safely.
6. Run migrations against a direct DB connection before production deploys:
   - `MIGRATE_DATABASE_URL='postgresql://...' pnpm migrate:deploy:direct`
7. Run release gates locally or in CI before shipping:
   - `pnpm vercel-build`
   - `pnpm release:verify`
   - `pnpm readiness:check:strict`
8. Verify runtime health after deploy:
   - `/api/health` (liveness)
   - `/api/health/ready` (config + DB readiness)

## License

See `LICENSE`.
