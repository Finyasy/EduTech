# Release Checks

Use this file when the release-readiness skill needs the concrete validation matrix.

## Validation Matrix

- Docs-only change:
  Run `pnpm lint` only if code snippets or linked paths were changed in a way that could drift from the app.
- Learner route or shared UI change:
  Run `pnpm lint`.
  Run `pnpm build` if route composition or server data loading changed.
- API route or server helper change:
  Run `pnpm lint`.
  Run `pnpm build`.
  Probe `/api/health` and one affected endpoint when practical.
- Release decision:
  Run `pnpm vercel-build`.
  Run `pnpm release:verify`.
  Run `pnpm readiness:check:strict`.

## Runtime Probes

- Basic liveness: `GET /api/health`
- Readiness: `GET /api/health/ready`
- Teacher surfaces: `/teach`, `/admin/teach`
- Learner surfaces: `/courses`, `/dashboard`, `/games`

## Release Report Expectations

- Lead with blockers.
- Separate confirmed failures from untested risks.
- Cite the command or route check that produced each conclusion.
