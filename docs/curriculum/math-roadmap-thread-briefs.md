# Maths Roadmap Implementation Briefs

## Shared Product Direction

Maths is the source of truth. AI, coding, and games are support layers that make CBC/CBE maths competencies easier to practice, observe, and review.

Use these shared anchors across all implementation threads:

- Curriculum scope: PP1 first, then PP2, Grade 1, Grade 2, and Grade 3.
- Current working slice: PP1 Term 2 Week 1, counting object sets 5-9.
- First game: `game-pp1-count-sets`, titled `PP1 Count The Set`.
- First course/roadmap route: `/courses/course-math`.
- First evidence target: learner counts each object once and matches the set to the correct numeral.
- Review docs:
  - `docs/curriculum/kenya-pp1-to-grade3-maths-implementation.md`
  - `docs/curriculum/pp1-term-2-maths-map.md`
  - `docs/curriculum/pp1-maths-assessment-bank.md`
  - `docs/curriculum/pp1-ai-coding-games-alignment.md`
- Runtime source:
  - `src/lib/curriculum/math-roadmap.ts`

## Student Frontend Thread

Goal: make the learner-facing maths journey coherent from homepage to roadmap to game.

Implementation tasks:

- Update learner navigation and course cards so `Kenya CBC/CBE Maths Roadmap` feels like a curriculum path, not a generic mission.
- Keep `/courses/course-math` focused on:
  - PP1-first roadmap
  - AI/coding/game alignment
  - first vertical slice
  - maths game templates
- Make `PP1 Count The Set` feel suitable for young learners:
  - large prompts
  - clear choices
  - short feedback
  - no unnecessary AI/coding language inside the game screen
- Add learner-facing copy that explains the purpose:
  - "Count the objects."
  - "Choose the matching number."
  - "Try again if you missed one."
- Make the path after game completion obvious:
  - replay
  - return to maths roadmap
  - next maths activity placeholder

Acceptance criteria:

- A signed-in learner can open `/courses/course-math`.
- A signed-in learner can open `/games/game-pp1-count-sets`.
- The maths roadmap is understandable without reading internal docs.
- The game is visibly connected to PP1 counting 5-9.

## Teacher Frontend Thread

Goal: make game practice usable as teacher evidence, not just learner activity.

Implementation tasks:

- Add a teacher-facing maths evidence panel for PP1 counting.
- Surface game attempts for `game-pp1-count-sets` in learner detail views.
- Map game evidence to the PP1 counting rubric:
  - Exceeds: correct and consistent, can explain count.
  - Meets: correct after normal instruction.
  - Approaches: partial accuracy or needs prompts.
  - Below: cannot complete without direct support.
- Show evidence in teacher language:
  - latest attempt
  - best score
  - missed quantities
  - support level
  - teacher observation note
- Add a manual teacher observation field:
  - "counted each object once"
  - "skipped/double-counted"
  - "matched numeral correctly"
  - "needed prompts"

Acceptance criteria:

- Teacher can see whether a learner practiced the PP1 counting game.
- Teacher can connect game attempts to the counting 5-9 competency.
- Teacher can add an observation note beside digital evidence.
- Teacher UI does not imply the game alone proves mastery.

## UI/UX Thread

Goal: make the maths roadmap feel like a clean curriculum product surface, not another marketing or mission page.

Implementation tasks:

- Use restrained, classroom-friendly visual hierarchy for maths views.
- Prefer dense but readable roadmap sections over decorative cards.
- Keep labels practical:
  - Strand
  - Competency
  - Activity
  - Evidence
  - Game
  - Teacher note
- Make PP1 content feel age-appropriate:
  - large touch targets
  - simple choices
  - little text per interaction
  - strong visual contrast
- Avoid overemphasizing AI/coding on PP1 learner screens.
- Use AI/coding language mainly in teacher/admin/curriculum contexts.
- Ensure mobile layout works for teacher and learner use.

Acceptance criteria:

- The roadmap is scannable on desktop and mobile.
- The game can be played comfortably on mobile.
- Text does not overflow cards/buttons.
- AI/coding/game alignment is visible but secondary to maths.

## Backend Thread

Goal: make the maths roadmap and learner evidence durable, queryable, and extensible.

Implementation tasks:

- Decide whether curriculum maps remain static TS data, database records, or CMS-managed content.
- If moving to database, model:
  - curriculum level
  - term
  - week
  - lesson
  - strand
  - sub-strand
  - competency
  - AI bridge
  - coding bridge
  - game id
  - evidence type
  - rubric id
- Connect game attempts to curriculum evidence:
  - game id
  - game level id
  - learner id
  - score
  - time
  - competency id
  - evidence interpretation
- Add an API shape for teacher dashboards:
  - learner
  - competency
  - latest evidence
  - best game attempt
  - teacher note
  - rubric level
- Keep fallback data aligned with seed data.
- Add tests for:
  - maths roadmap data
  - PP1 counting game levels
  - evidence aggregation
  - teacher dashboard null-safety

Acceptance criteria:

- `game-pp1-count-sets` exists in fallback and seed data.
- Game attempts can be linked to PP1 counting evidence.
- Teacher dashboard can read evidence without null crashes.
- Static fallback and database-backed behavior stay consistent.

## Cross-Thread Rules

- Do not replace concrete classroom activities with digital games.
- Do not make AI/coding the curriculum objective for PP1 maths.
- Use KICD/CBC/CBE alignment as the curriculum authority.
- Every learner-facing digital activity must produce teacher-usable evidence.
- Every evidence item should record support level, not only correctness.
- Keep Term 1 and Term 3 as placeholders until source schemes are supplied.

## Suggested Thread Prompts

Student frontend:

```text
Implement the learner-facing PP1 maths journey using docs/curriculum/math-roadmap-thread-briefs.md. Focus on /courses/course-math and /games/game-pp1-count-sets. Keep maths primary and make the game age-appropriate for PP1.
```

Teacher frontend:

```text
Implement teacher evidence views for the PP1 counting vertical slice using docs/curriculum/math-roadmap-thread-briefs.md. Surface game-pp1-count-sets attempts as evidence beside teacher observation notes and rubric levels.
```

UI/UX:

```text
Review and improve the maths roadmap UX using docs/curriculum/math-roadmap-thread-briefs.md. Keep the experience classroom-focused, mobile-safe, and visually calm. AI/coding/game alignment should support maths, not dominate it.
```

Backend:

```text
Implement durable backend support for the PP1 maths roadmap using docs/curriculum/math-roadmap-thread-briefs.md. Focus on curriculum data shape, game-to-competency evidence mapping, teacher dashboard aggregation, and fallback/seed consistency.
```
