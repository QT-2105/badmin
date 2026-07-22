# Protected Files

## Auth, Permission and Security

- `src/components/users/auth-users-panel.tsx`
- `src/hooks/use-auth.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/auth/*`
- `src/app/api/auth/**`
- `src/app/api/users/**`
- `src/app/api/role-permissions/**`
- `middleware.ts`

## Data and Contracts

- `prisma/**`
- `src/repositories/**`
- `src/services/**`
- `src/types/**`
- `src/app/api/**`

## Protected Functions and Contracts

- `handleCreateUser`
- `handleUpdateUser`
- `handleUserEmailBlur`
- `handleUserDisplayNameBlur`
- `handleUserRoleChange`
- `handleUserStatusChange`
- `handleSaveUserPassword`
- `togglePermission`
- `saveRolePermissions`
- user sorting and pagination derivation
- `selectedRoleLocked`
- role code values
- permission key values
- status values
- API payloads
- query keys and mutations
- cache invalidation behavior
- route guards and server authorization
