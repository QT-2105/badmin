# Implementation Plan

## Precondition

Role management is PARTIAL. Fixed-role presentation exists. Role CRUD is Missing Capability and must not be implemented.

## Allowed Source File

- `src/components/users/auth-users-panel.tsx`

## Protected Files

- `src/lib/auth/permissions.ts`
- `src/app/api/auth/**`
- `src/repositories/**`
- `src/services/auth-service.ts`
- `prisma/**`

## Steps

1. Preserve `USER_ROLES` order and values.
2. Preserve `getRoleLabel` output.
3. Preserve `roleDescriptions` semantics.
4. Preserve create-user role selector payload.
5. Preserve inline user role selector payload.
6. Preserve permission role selector behavior.
7. Preserve Owner special handling: full permissions, no save action, disabled permissions.
8. Add presentation-only role statistics from existing `authUsers` and `draftPermissions`/`PERMISSION_DEFINITIONS`.
9. Improve role note density and selected-role context.
10. Do not add create/edit/delete role actions.
11. Run lint, typecheck, build, DB schema guard, and protected diff.

## Completion Criteria

- Role values unchanged.
- Role labels unchanged.
- Role CRUD not introduced.
- User-role mapping unchanged.
- Role-permission mapping unchanged.
- Permission save payload unchanged.
- Owner full-permission behavior unchanged.
- Presentation is clearer in light/dark and responsive layouts.
