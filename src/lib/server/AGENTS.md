# Server Helpers AGENTS

## Scope

These instructions apply to files under `src/lib/server`.

## Design Rules

- Keep this directory server-only in behavior and imports.
- Centralize auth, Prisma, timeout, caching, degraded-mode, and workspace access rules here rather than inside pages or route handlers.
- Prefer extending existing helpers such as `ensureUserByIdWithTimeout`, `requireStaff`, and cached data loaders before adding parallel implementations.
- Preserve fallback behavior for public course and game data when the database is unavailable or slow.

## Performance And Resilience

- Add timeouts around external or database-backed work that can block route rendering.
- Keep cache keys and tags stable and scoped to the data being invalidated.
- Put degraded-mode decisions in shared helpers, not in UI code.
- When changing auth or teacher-store helpers, keep unauthorized, timed-out, and disabled states distinct.

## Verification

- Run `pnpm lint` for localized helper changes.
- Run `pnpm build` when changing shared server contracts, caching, Prisma access, or auth helpers.
- Run `pnpm release:verify` before declaring broad server-layer changes release ready.
