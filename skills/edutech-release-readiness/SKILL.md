---
name: edutech-release-readiness
description: Validate EduTech before release or deployment. Use for requests like fix failing deploy, check Vercel readiness, review release blockers, verify production health, confirm Prisma migration safety, or audit ship readiness before production.
---

# EduTech Release Readiness

Use this skill to decide whether EduTech is ready to ship and to report blockers with file paths, commands, and next actions.

## Workflow

1. Inspect scope with `git status --short` and note untracked migrations, API routes, or docs that affect the release surface.
2. Read `README.md`, `docs/production-readiness.md`, and `CLERK_SETUP.md` only when they affect the current release question.
3. Run the narrowest useful checks first, then broaden to release gates when the request is a ship/no-ship decision.
4. Probe affected routes when auth, middleware, rendering, or runtime health is part of the risk.
5. Report blockers first, then checks run, remaining risks, and next actions.

## References

- For the exact validation matrix and runtime probes, read [references/checks.md](./references/checks.md).

## Guardrails

- Preserve App Router and `src/proxy.ts` auth behavior.
- Use `pnpm` scripts from the repo root.
- Do not add new production dependencies during a release check unless explicitly asked.
