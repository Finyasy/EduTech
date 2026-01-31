# Project Plan: Online Children's School (v1)

## Purpose
Build a minimal, production-ready learning platform for children with video lessons, lightweight games, and progress tracking. v1 prioritizes a clean learning loop over complex admin tooling or heavy game engines.

## Recommended Defaults for v1
- Authentication and roles: admin and student only (parent/teacher later).
- Content source: database-backed content (courses, lessons, tags, ordering).
- Games: lightweight client-side games (React + Canvas/Pixi-style), no Phaser in v1.
- Video delivery: YouTube embeds for adaptive streaming; "low-bandwidth friendly" rather than offline.
- Internationalization: not in v1, but schema is future-ready for localization.

## Stack
- Next.js 16.1.4 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma
- Auth (choose one):
  - Clerk (fastest to ship)
  - NextAuth (more control)

## Architecture Principles
- Server components by default; client components only for interactive surfaces (games, video player controls, quizzes).
- Explicit server/client boundaries inside feature modules.
- Content and progress stored in the database; JSON seeding optional for fast initialization.
- Keep admin tooling minimal but functional for content CRUD and publish state.

## How Next.js "Full Stack" Works (App Router)
- Everything lives under `app/`.
- UI routes: `app/(segment)/page.tsx`.
- Layouts: `app/layout.tsx` plus nested layouts per section.
- Server components by default (secure data fetching).
- Client components only when needed (`"use client"` for interactivity).
- API endpoints via `app/api/.../route.ts` (no separate server).
- One repo and deployment, with clear server/client separation.

## Key Concepts You'll Use a Lot
### 1) Server Components vs Client Components
Server components (default)
- Great for loading courses/lessons from DB, server-side authorization, SEO pages.
- Safe for direct DB access (no secret exposure).

Client components (`"use client"`)
- Needed for game engines (Phaser/Pixi/Canvas), timers, animations, interactive quizzes, YouTube player control.
- Common pattern: server component loads data -> passes to client component for interaction.

### 2) Route Handlers = Your Backend API
- Example: `app/api/progress/route.ts`
- Handles `POST /api/progress` for quiz/game progress.
- Validate input, verify session, write to DB.
- Express-like logic, built into Next.

### 3) Data Layer (Strongly Recommended)
- PostgreSQL + Prisma
- Host DB on Supabase or Neon
- Model: users, courses, lessons (YouTube IDs), games, progress, badges/streaks (optional)

### 4) Tailwind + Component Library
- Tailwind speeds up UI development.
- Add `shadcn/ui` for forms/dashboards and consistent components.

## YouTube Video Strategy
- Store `videoId`, title, description, tags, duration, playlist/topic in DB.
- Embed with:
  - `<iframe>` (simple), or
  - YouTube IFrame Player API (track play/pause/end).
- Learning features:
  - Save watch progress every N seconds.
  - Unlock quizzes/games after X% watched.

## Logic/Math Games Approach
- Use a client component for the game UI.
- Prefer lightweight PixiJS/Canvas in v1; Phaser in v2.
- Place game UI in `app/(dashboard)/games/[gameId]/page.tsx`.
- Keep logic + level definitions in `lib/` or seeded content.

## MVP Features (v1) - Ordered Delivery Checklist
1) Auth and roles: student + admin.
2) Course list and lesson pages (server-rendered).
3) Video lesson player + "continue watching".
4) "Mark complete" + progress tracking.
5) Simple student dashboard (continue, completed, streak).
6) Quiz after lesson (MCQ/short answer).
7) One mini-game type with levels + scoring.
8) Admin CRUD for courses/lessons/quizzes/games.

## Database Schema (Minimum Viable)
Core tables:
- User: id, email, name, role
- Course: id, title, description, gradeLevel, isPublished
- Lesson: id, courseId, title, videoId, order, notes, isPublished
- QuizQuestion: id, lessonId, type, question, options, answer, explanation
- Game: id, title, description, isPublished
- GameLevel: id, gameId, levelNumber, configJson

Tracking tables:
- LessonProgress: userId, lessonId, completedAt, watchPercent
- QuizAttempt: userId, lessonId, score, submittedAt
- GameAttempt: userId, gameLevelId, score, timeMs, submittedAt

These are enough for dashboards, unlocks, and future leaderboards.

## MVP Scope (2 Sprints)
Sprint 1 (Core learning loop) aligns to checklist items 1-5
- Auth and roles.
- Course list and lesson pages with YouTube embed.
- "Continue watching" + "Mark complete".
- Progress tracking + simple student dashboard.
- DB content + seed script.

Sprint 2 (Engagement) aligns to checklist items 6-8
- Quizzes (5-10 questions per lesson).
- One mini-game type with levels + scoring.
- Progress rules (unlock next lesson after completion).
- Admin CRUD for courses/lessons/quizzes/games.

## Next Concrete Steps
- Generate Prisma schema + seed.
- Create main routes/pages.
- Add auth.
- Build lesson + progress flow.

Assumptions to proceed without back-and-forth:
- Roles: admin + student.
- Content: DB-backed.
- Games: lightweight.
- Video: YouTube embed.
- i18n: deferred.

## Practical Gotchas
- Do not make everything client-side; keep interactive components only.
- DB calls belong on the server (server components or route handlers).
- Use Zod for validating all API inputs.
- Plan auth early (student roles now; admin vs student in v1).

## App Router Structure (Proposed)
app/
  (public)/
  (learning)/
  (games)/
  (videos)/
  (parents)/
  (teachers)/
  (admin)/
  api/

components/
  ui/
    server/
    client/
  shared/

lib/
  server/
  client/

styles/
types/
public/

Notes:
- `app/(games)/[gameId]/page.tsx` and `app/(videos)/[videoId]/page.tsx` are server wrappers.
- Client-only components live under `client/` subfolders within those features.

## High-Level Modules
### Auth and Accounts
- Sign in/up
- Role checks (admin vs student)

### Content
- Courses -> Modules -> Lessons
- Lesson includes YouTube videoId, notes, tags, difficulty, order

### Learning Experience
- Lesson page: video + notes + "Mark complete"
- Quiz page: MCQ/short answer with simple scoring

### Games
- One lightweight game type in v1 (logic/puzzle)
- Level definitions in DB (or seeded JSON)

### Progress and Analytics
- Track completions, quiz scores, and game best scores
- Student dashboard: "Continue", "Completed", "Streak"
- Watch progress is optional in v1

### Admin
- CRUD for courses/lessons/quizzes/games
- Publish/unpublish content

## Data Model Sketch (v1)
- User: id, role, profile fields
- Course: title, description, order, published
- Module: courseId, title, order, published
- Lesson: moduleId, title, videoId, notes, tags, difficulty, order, published
- Quiz: lessonId, questions (JSON), published
- Game: title, type, levelData (JSON), published
- Progress: userId, lessonId, status, completedAt
- QuizResult: userId, quizId, score, completedAt
- GameScore: userId, gameId, bestScore, updatedAt

## V2 Deferred Items
- Teacher dashboards
- Parent controls
- Classroom management
- Phaser-based games
- True offline video support
- Full i18n/localization system
