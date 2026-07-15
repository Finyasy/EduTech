---
name: lesson-artifact-review
description: Review learner artifact submission and scoring flows in EduTech. Use for requests like inspect artifact API behavior, review learner build evidence, debug teacher artifact panels, verify mastery scoring, or tighten lesson artifact UX and data handling.
---

# Lesson Artifact Review

Use this skill when the task centers on learner artifact submission, teacher review, or mastery scoring.

## Workflow

1. Identify whether the change is in learner submission, teacher review, scoring, or shared artifact data contracts.
2. Read the relevant route handler and the matching UI surface before editing.
3. Preserve the current contract between learner artifact APIs, teacher artifact APIs, and shared summaries from `@/lib/server/data`.
4. Verify authorization boundaries separately for learner submission and staff review flows.
5. Report or implement changes with the narrowest route, component, and server-helper scope possible.

## References

- For route and component touchpoints, read [references/workflow.md](./references/workflow.md).
