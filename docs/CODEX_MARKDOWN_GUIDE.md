# Codex Markdown Guide

This repository keeps Codex-facing Markdown small, specific, and easy to load.

## Instruction Files

- Use `AGENTS.md` for project instructions that Codex should load automatically.
- Put the highest-priority rules at the top.
- Keep instruction files under 1,500 words when practical.
- Keep long explanations, design notes, incident reports, and historical logs in `docs/`.
- Split specialized instructions into nested `AGENTS.md` or `AGENTS.override.md` files only when a subtree needs different rules.
- Prefer local `AGENTS.md` files in active subtrees such as `src/app/api`, `src/app/(learning)`, `src/components/teacher`, and `src/lib/server` when those areas need rules that would be noisy at the repo root.

Codex loads global guidance first, then project guidance from the repository root down to the working directory. The combined instruction content is capped by `project_doc_max_bytes`, which defaults to 32 KiB. If guidance is truncated, split it by directory or raise the local Codex setting.

```toml
# ~/.codex/config.toml
project_doc_max_bytes = 65536
```

## Regular Markdown

- Use regular `.md` files for project documentation, plans, and reports.
- Keep documents focused on one durable topic.
- Prefer short summaries with links to supporting details.
- Avoid repeating setup instructions across several files; link to the canonical doc.
- Keep generated artifacts under `artifacts/` unless they are durable project docs.

## Skill Files

This repository includes local skills under `skills/`.

For any new skill:

- Start with valid front matter containing `name` and `description`.
- Keep `description` under 1,024 characters.
- Make the description trigger-oriented: say when Codex should use the skill, with likely user phrases when possible.
- Put operational detail in the body, scripts, or referenced files.
- Keep metadata ASCII unless there is a clear reason not to.
- Move longer command matrices or domain detail into `references/` so the main `SKILL.md` stays easy to load.

Example:

```md
---
name: release-readiness
description: Check EduTech release readiness by running validation scripts, reviewing deployment docs, and reporting blockers before production deploys.
---

# Release Readiness

Run the checks listed here and report failures with file paths, commands, and next actions.
```

## Current Audit

- Three repository-local skills exist: release readiness, lesson artifact review, and Clerk/Prisma debugging.
- Scoped `AGENTS.md` files exist for API routes, learning routes, teacher components, and server helpers.
- All current Markdown files are below the default 32 KiB Codex instruction cap.
- `docs/HANG_RECOMMENDATIONS.md` was condensed because it exceeded the preferred 1,500-word documentation target.
