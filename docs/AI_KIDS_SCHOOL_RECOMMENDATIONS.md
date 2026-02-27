# AI Kids School Recommendations

## Goal
Design the school around young learners so Artificial Intelligence, coding, and mathematics are taught as one connected learning experience.

## UI/UX Recommendations

1. Age-based entry paths
- Separate experiences for ages `5-7`, `8-10`, and `11-14`.
- Adjust language, pace, and interaction complexity by age.

2. Mission-first navigation
- Replace generic course browsing with mission framing such as `Train a Robot`, `Build a Chatbot`, and `Solve Math with Code`.

3. Learn -> Build -> Share lesson flow
- Every lesson should end in a build artifact and short learner reflection.

4. Visual-first lesson delivery
- Prefer cards, icons, short text chunks, and simple action steps.

5. Safe AI support by default
- Offer guided prompt starters instead of unrestricted chat.

6. Mastery map dashboards
- Show progress by `AI concepts`, `coding skills`, and `math skills` for students, teachers, and families.

7. Accessibility defaults
- Keep text readable, high contrast, and touch-friendly actions (`min-h-11` targets).

## Course Design Recommendations

1. Integrated curriculum spine per unit
- `AI concept` + `coding skill` + `math concept` must all be explicit.

2. Three-stage progression
- `Explorer` (ages 5-7)
- `Builder` (ages 8-10)
- `Creator` (ages 11-14)

3. Project-first modules
- Start each module with what learners will build.

4. Short session structure
- `10-15 min learn`
- `15-20 min build`
- `5 min reflection`

5. Performance assessments
- Evaluate explanations, code quality, math interpretation, and safe AI behavior.

6. Block-to-Python bridge
- Start visual, then transition older learners toward Python functions and data logic.

## Implementation Status in This Repo

### Implemented
- Mission-first public homepage and age path navigation.
- Course library reframed as mission cards with AI/Code/Math metadata.
- Course detail pages now show curriculum spine and mission outcomes.
- Lesson pages now include explicit `Learn/Build/Share` phase and mission checklist.
- Safe AI helper prompts added to lesson sidebar.
- Dashboard enhanced with mastery map for AI, coding, and math.
- Mock curriculum rewritten into Explorer/Builder/Creator aligned missions.

### Partially Implemented
- Parent/teacher dedicated dashboard pages are scaffolded by existing workspace routes, but full role-based mastery reporting logic still needs backend expansion.

### Next Improvements
1. Persist curriculum metadata in database schema (instead of mock-only fields).
2. Add teacher rubric scoring API for AI/code/math mastery.
3. Add student artifact gallery and monthly capstone submission workflow.
4. Introduce adaptive difficulty based on mastery map signals.
