# Sprint 11.13C — Users Presentation Refactor Baseline

## Status

BASELINE COMPLETED

## Line Count Baseline

Command:

```bash
wc -l src/components/users/auth-users-panel.tsx
```

Result:

- `src/components/users/auth-users-panel.tsx`: 623 lines

## Function Map

| Function / block | Current responsibility | Refactor decision |
| --- | --- | --- |
| `AuthUsersPanel` | Auth hooks, user mutations, role-permission mutations, create-user form state, password draft state, draft permission state, pagination state, permission expansion state, selected role state, derived users/role/permission data, and render all Users UI. | Keep hooks, state, derived security-related data, submit handlers, payload construction, and mutation calls in parent. Move presentation sections out. |
| `handleCreateUser` | Calls create-user mutation with `newUser` payload and resets form to default `OPERATOR`. | Protected in parent. |
| `handleUpdateUser` | Calls update-user mutation with `{ userId, payload }` and clears password draft after password update. | Protected in parent. |
| `togglePermission` | Updates draft permission array for selected non-OWNER role. | Protected in parent. |
| `saveRolePermissions` | Calls role-permission mutation with `{ role, permissions }`. | Protected in parent. |
| Inline user blur/select handlers | Compare field values and construct update-user payloads. | Move payload construction into parent-specific callbacks before passing to presentation. |
| `RoleNote` | Role summary card presentation. | Move to users presentation file. |
| `RequiredMark` | Required marker presentation. | Move to users presentation file. |
| `FieldHint` | Field helper text presentation. | Move to users presentation file. |
| `UserInitialsAvatar` and `getUserInitials` | Avatar presentation helper. | Move to users presentation file. |
| `countSelectedPermissions`, `toDomId`, `formatUserDate` | Display helpers. | Move to users presentation file as presentation-only helpers. |

## State Ownership Map

All state remains owned by `AuthUsersPanel`:

- `newUser`
- `userPasswords`
- `draftPermissions`
- `usersPageSize`
- `usersPage`
- `permissionsExpanded`
- `selectedRole`

Query state remains owned by auth hooks:

- `useCurrentUser`
- `useAuthUsers`
- `useRolePermissions`

Mutation state remains owned by auth mutation hooks:

- `useAuthUserMutations`
- `useRolePermissionMutations`

## Handler Map

Handlers that must remain parent-owned:

- `handleCreateUser`
- `handleUpdateUser`
- `handleUserEmailBlur`
- `handleUserDisplayNameBlur`
- `handleUserRoleChange`
- `handleUserStatusChange`
- `handleUserPasswordChange`
- `handleSaveUserPassword`
- `togglePermission`
- `saveRolePermissions`
- `setNewUser`
- `setUsersPageSize`
- `setUsersPage`
- `setPermissionsExpanded`
- `setSelectedRole`

## Query And Mutation Map

Parent-owned and unchanged:

- `useCurrentUser`
- `useAuthUsers`
- `useRolePermissions`
- `useAuthUserMutations`
- `useRolePermissionMutations`
- `authMutations.createUser.mutateAsync(newUser)`
- `authMutations.updateUser.mutateAsync({ userId, payload })`
- `roleMutations.updateRolePermissions.mutateAsync({ role, permissions: draftPermissions[role] ?? [] })`

## Protected Functions

Protected in this sprint:

- `handleCreateUser`
- `handleUpdateUser`
- `togglePermission`
- `saveRolePermissions`
- user update payload construction
- role-permission payload construction
- `OWNER` lock behavior
- current-user role lock behavior
- permission key mapping
- role code mapping
- status value mapping
- query keys, mutation behavior, auth services, server authorization

## Protected Files

Must not be modified:

- `src/hooks/use-auth.ts`
- `src/lib/auth/**`
- `src/services/auth-service.ts`
- `src/repositories/**`
- `src/app/api/auth/**`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`
