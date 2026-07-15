# AGENTS.md

## Repository Expectations

- Use `pnpm` for package scripts and dependency work.
- Prefer server components in `src/app` unless UI state, browser APIs, or interactivity require a client component.
- Keep database access in server code and shared server helpers under `src/lib/server`.
- Preserve Clerk App Router patterns: `clerkMiddleware()` in `src/proxy.ts`, health-route bypasses in the proxy, and `<ClerkProvider>` in `src/app/layout.tsx`.
- Do not commit real secrets. Use placeholders in docs and `.env.local` for local credentials.

## Verification

- For app code changes, run the narrowest useful check first, then broaden when shared behavior changes.
- Use `pnpm lint` for targeted UI, route, or utility edits that do not change deployment wiring.
- Use `pnpm build` when App Router boundaries, server code, route handlers, or Prisma-backed reads change.
- Use `pnpm vercel-build` when validating Vercel-equivalent production behavior.
- Use `pnpm release:verify` before a ship/no-ship recommendation.
- For auth, middleware, rendering, or dashboard changes, verify at least one affected route locally.
- For write-route changes, prefer the narrowest matching Vitest or Playwright command from `package.json`.

## Markdown And Skills

- Keep Codex-facing guidance short and put critical rules near the top.
- Keep this file under 1,500 words and well below Codex instruction byte limits.
- Move long explanations, incident reports, and historical notes into `docs/` instead of this file.
- Keep skill front-matter `description` fields short, specific, ASCII, and under 1,024 characters.
- A skill should describe when to use the workflow in metadata, then put detailed steps in the body or referenced scripts.
- Prefer subtree `AGENTS.md` files for API, learning, teacher, or server-helper rules instead of expanding this root file.
