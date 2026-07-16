# Teacher Components AGENTS

## Scope

These instructions apply to components under `src/components/teacher`.

## Component Rules

- Preserve the existing teacher workspace composition around `TeacherWorkspaceClient`, scaffold components, and focused panels.
- Prefer extracting focused child panels over expanding `TeacherWorkspaceClient` further.
- Keep teacher-only data contracts typed with `@/lib/teacher/types`.
- Reuse teacher workspace route shells and panels instead of duplicating tab logic across admin and teacher surfaces.

## State And Networking

- Keep network requests and mutation helpers explicit inside the teacher client surface.
- Preserve partial-data merge behavior and refresh guards when modifying workspace refresh flows.
- Keep artifact-review UI aligned with the teacher artifact API payloads instead of reshaping data in several components.

## Verification

- Run `pnpm lint` after teacher component changes.
- Run `pnpm build` when component changes depend on route props, server payload shape, or shared type updates.
- Prefer `pnpm test:e2e:teacher` when the teacher workspace flow or tab navigation changes materially.
