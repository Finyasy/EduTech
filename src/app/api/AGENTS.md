# API AGENTS

## Scope

These instructions apply to route handlers under `src/app/api`.

## Route Design

- Validate query strings and JSON payloads with `zod`.
- Use `parseJsonBody` from `@/lib/server/request` for JSON body parsing when a route accepts a body.
- Return `NextResponse.json(...)` with explicit HTTP status codes for invalid input, unauthorized access, missing records, and configuration failures.
- Keep health endpoints lightweight and available without Clerk middleware.
- Reuse server helpers from `@/lib/server/*` instead of duplicating auth, Prisma, or teacher-store logic inside routes.

## Auth And Data Boundaries

- Use `auth()` only for simple signed-in checks.
- Use `requireStaff`, `requireAdmin`, or teacher access helpers when role checks matter.
- Fail fast with `501` when the route requires Prisma but the database is not configured.
- Preserve degraded-mode and timeout behavior in server helpers instead of adding ad hoc route-level retries.

## Verification

- For read routes, run `pnpm lint` and probe the changed endpoint locally when practical.
- For write routes, run `pnpm lint` plus the narrowest relevant test command from `package.json`.
- For auth or middleware-adjacent routes, probe `/api/health` and one affected protected route.
