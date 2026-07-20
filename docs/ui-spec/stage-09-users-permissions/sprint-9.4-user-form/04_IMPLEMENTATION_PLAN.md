# Implementation Plan

## Allowed Source File

- `src/components/users/auth-users-panel.tsx`

## Protected Files

- `middleware.ts`
- `src/app/api/auth/**`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/auth-users-repository.ts`
- `src/repositories/role-permissions-repository.ts`
- `prisma/**`

## Field Contract

See `01_CURRENT_AUDIT.md` for the required field table. The implementation must preserve all field keys, default values, option values, validation ownership, payload mapping, handlers, and permission requirements.

## Implementation Steps

1. Improve create-user form grouping using presentation-only layout classes.
2. Add clearer visual hierarchy for required fields and helper text without changing validation.
3. Improve inline edit controls with existing shared primitives and accessibility labels.
4. Keep `newUser` shape unchanged.
5. Keep `userPasswords` behavior unchanged.
6. Keep `handleCreateUser` and `handleUpdateUser` unchanged.
7. Keep `autoComplete` values unchanged.
8. Keep `USER_ROLES` and status option values unchanged.
9. Do not add invitation flow, cancel flow, new password behavior, role filtering, or extra permission checks.
10. Run lint, typecheck, build, and protected diff.

## Completion Criteria

- Create form remains functionally identical.
- Inline edit rows remain functionally identical.
- Submit payloads are unchanged.
- Default role remains `OPERATOR`.
- Existing role/status/password flows are unchanged.
- Presentation is more readable in light/dark mode and responsive layouts.
