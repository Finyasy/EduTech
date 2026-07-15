# Artifact Workflow Reference

## Primary Files

- Learner submit/read route: `src/app/api/artifacts/route.ts`
- Teacher artifact list route: `src/app/api/teach/artifacts/route.ts`
- Teacher artifact scoring route: `src/app/api/teach/artifacts/[artifactId]/score/route.ts`
- Learner lesson panel: `src/components/learning/LessonArtifactPanel.tsx`
- Teacher artifact panel: `src/components/teacher/RecentArtifactsPanel.tsx`
- Shared summaries and queries: `src/lib/server/data.ts`

## Review Rules

- Learner routes should require a signed-in learner and return `401` when unauthenticated.
- Teacher review routes should use staff checks and return `403` or `401` through the existing auth helpers.
- Scoring changes must preserve dashboard cache invalidation through `revalidateTag`.
- Shared artifact summary shapes should be updated in one place and consumed downstream rather than re-mapped repeatedly in UI code.

## Verification

- Run `pnpm lint`.
- Run `pnpm build` when payload shapes, route params, or shared server data contracts change.
- Verify one learner submission path and one teacher review path when the behavior changes materially.
