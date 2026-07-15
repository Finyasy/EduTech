# LearnBridge Product Roadmap

## Current Direction

LearnBridge has moved beyond the original student/admin MVP. The active product is a mission-based school experience for young learners that blends AI, coding, and mathematics with teacher visibility.

## Product Roles

- Learner: completes missions, watches lessons, submits build evidence, plays practice games, and tracks mastery.
- Teacher: runs classes, assigns missions, monitors learner status, and reviews submitted artifacts.
- Admin: manages content, publishing, staff access, and school setup.

## Near-Term Priorities

1. Persist learner artifacts and mastery evidence.
   - Learners should submit a project title, build type, optional link, and reflection from lesson pages.
   - Teachers should see recent learner artifacts in the workspace.

2. Make mastery rubric-backed.
   - AI, coding, and math mastery should come from assessed artifacts, quiz attempts, and game evidence rather than completion-count heuristics alone.

3. Link classroom learners to authenticated learner accounts.
   - Current teacher roster learners and Clerk users are separate concepts.
   - A join or invitation flow is required before class-level artifact review can be precise.

4. Move user provisioning to Clerk webhooks.
   - Request-time auth should read local user records.
   - Clerk create/update events should own user sync and role refresh.

5. Split the teacher workspace UI into smaller modules.
   - The current workspace is feature-rich but concentrated in one client component.
   - Extract class switching, teaching plan, learners, progress, assignment queue, and artifact review panels.

## Implementation Status

- Added Prisma models for learner artifacts, mastery rubrics, and mastery scores.
- Added learner artifact submission from lesson pages.
- Added staff access to recent learner artifacts.
- Added a teacher workspace panel for recent build evidence.

## Documentation Note

Codex-facing Markdown and future skill metadata rules live in [CODEX_MARKDOWN_GUIDE.md](./CODEX_MARKDOWN_GUIDE.md).
