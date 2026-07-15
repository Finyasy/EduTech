# Learning AGENTS

## Scope

These instructions apply to learner-facing routes under `src/app/(learning)`.

## Page Composition

- Keep route files server-first and push interactivity into colocated `client/` components.
- Load course, lesson, quiz, and artifact data through `@/lib/server/data`.
- Preserve fallback-data behavior when the database is unavailable.
- Keep learner flows resilient: a slow auth or data dependency should degrade cleanly rather than block the whole page.

## UX Boundaries

- Keep learning pages focused on the learner loop: lesson content, progress, quiz, and artifact submission.
- Reuse existing learning components before introducing new layout patterns.
- Preserve URL structure under `/courses/...` because quizzes, lesson actions, and artifact flows depend on it.

## Verification

- Run `pnpm lint` for isolated UI or route edits.
- Run `pnpm build` when server data loading, page params, or App Router composition changes.
- For lesson, quiz, or artifact changes, verify the affected learner route locally.
