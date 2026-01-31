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
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"

# Clerk (required for auth UI)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."

# Comma-separated list of admin emails
ADMIN_EMAILS="admin@example.com,other@example.com"
```

Notes:
- If `DATABASE_URL` is not set, the app serves mock data for courses, lessons, and games.
- Admin pages require both `DATABASE_URL` and a user whose email appears in `ADMIN_EMAILS`.

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
- `pnpm start` — start production server
- `pnpm lint` — run ESLint
- `pnpm prisma` — Prisma CLI
- `pnpm prisma:generate` — generate Prisma client
- `pnpm prisma:migrate` — run migrations
- `pnpm prisma:studio` — open Prisma Studio
- `pnpm db:seed` — seed the database

## Project structure

- `src/app` — routes, pages, and API endpoints
- `src/components` — shared UI components
- `src/lib` — server helpers and utilities
- `prisma` — schema, migrations, and seed script
- `public` — static assets

## License

See `LICENSE`.
