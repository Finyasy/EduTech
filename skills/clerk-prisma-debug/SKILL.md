---
name: clerk-prisma-debug
description: Debug EduTech auth, Clerk middleware, Prisma connectivity, and user-sync behavior. Use for requests like debug sign-in failure, fix Clerk webhook sync, investigate unauthorized API responses, diagnose route hangs, or trace auth-to-database boundary issues.
---

# Clerk Prisma Debug

Use this skill when the problem crosses Clerk auth, route protection, database access, or local runtime behavior.

## Workflow

1. Decide whether the failure starts in middleware, auth state, role resolution, webhook sync, Prisma connectivity, or route composition.
2. Read the smallest relevant set of files from `src/proxy.ts`, `src/app/api/webhooks/clerk/route.ts`, `src/lib/server/auth.ts`, `src/lib/server/prisma.ts`, and the affected route or page.
3. Preserve the distinction between disabled, unauthenticated, unauthorized, timed-out, and database-not-configured states.
4. Probe `/api/health` and then the affected protected route when runtime behavior is in question.
5. Prefer fixing shared auth or Prisma helpers over patching symptoms into individual routes.

## References

- For the diagnostic checklist and touchpoints, read [references/checklist.md](./references/checklist.md).
