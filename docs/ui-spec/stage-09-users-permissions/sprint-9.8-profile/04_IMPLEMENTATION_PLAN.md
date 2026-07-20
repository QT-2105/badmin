# Implementation Plan

1. Do not create a profile route.
2. Do not add profile edit.
3. Do not add password change flow.
4. Polish `src/components/app-shell.tsx` read-only current-user presentation only.
5. Preserve `useCurrentUser`, `/api/auth/me`, query key, session identity, logout behavior, route behavior, and permission behavior.
6. Use only existing current-user fields: `displayName`, `email`, `role`, and `status`.
7. Add no inputs, no forms, no mutation, no avatar upload, no password change, and no permission-management action.
8. Run lint, typecheck, build, DB schema guard, and protected diff.

## Protected Files

- `src/app/api/auth/me/route.ts`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/**`
- `prisma/**`

## Presentation Changes

- Replace the small sidebar user row with a read-only profile summary surface.
- Add generated initials avatar from existing display name/email.
- Show current user's display name, email, role badge, and status badge.
- Keep collapsed sidebar profile representation read-only and compact.

## Completion Criteria

- Profile capability remains PARTIAL.
- No profile route is created.
- No editable profile fields are introduced.
- No auth, session, token, cookie, query, mutation, API, validation, permission, repository, service, Prisma, or database behavior changes.
- Validation passes.
