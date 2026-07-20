# Implementation Plan

## Precondition

Permission management is AVAILABLE for the existing role-permission matrix and PARTIAL because permission keys are code-defined. Permission CRUD is Missing Capability and must not be implemented.

## Allowed Source File

- `src/components/users/auth-users-panel.tsx`

## Protected Files

- `src/lib/auth/permissions.ts`
- `src/app/api/auth/role-permissions/route.ts`
- `src/repositories/role-permissions-repository.ts`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `prisma/**`

## Steps

1. Preserve permission definitions and group names.
2. Preserve `permissionGroups` grouping source.
3. Preserve `checked` expression.
4. Preserve `selectedRoleLocked` disabled condition.
5. Preserve `togglePermission(selectedRole, item.key)`.
6. Preserve `saveRolePermissions(selectedRole)` and payload.
7. Preserve Owner read-only/full-permission presentation.
8. Improve permission group header hierarchy and selected/total count presentation.
9. Improve checkbox row density, hover, checked, disabled, light/dark, and keyboard focus presentation.
10. Do not add permission search, select-all, indeterminate, cancel/reset, inheritance, or permission CRUD.
11. Run lint, typecheck, build, DB schema guard, and protected diff.

## Completion Criteria

- Permission keys unchanged.
- Permission labels unchanged.
- Permission groups unchanged.
- Role-permission mapping unchanged.
- Assignment remains direct local draft plus explicit save.
- Owner system-role restrictions unchanged.
- Unauthorized user cannot modify through current disabled state and server authorization.
