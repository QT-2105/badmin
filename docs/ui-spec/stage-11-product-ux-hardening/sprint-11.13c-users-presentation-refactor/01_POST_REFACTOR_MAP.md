# Sprint 11.13C — Post Refactor Map

## Status

COMPLETED

## Line Count Comparison

| File | Before | After | Notes |
| --- | ---: | ---: | --- |
| `src/components/users/auth-users-panel.tsx` | 623 | 176 | Parent now owns auth/role hooks, mutations, form state, permission drafts, pagination, selected role, derived counts, payload construction and mutation calls. |
| `src/components/users/auth-users-presentation.tsx` | 0 | 760 | New presentation-only module for create-user form, user list, role cards, permission matrix and visual helpers. |

## Decomposition Implemented

`AuthUsersPanel`

- Keeps `useCurrentUser`.
- Keeps `useAuthUsers`.
- Keeps `useRolePermissions`.
- Keeps `useAuthUserMutations`.
- Keeps `useRolePermissionMutations`.
- Keeps create-user form state.
- Keeps password draft state.
- Keeps draft permission state.
- Keeps users pagination state.
- Keeps permission expanded state and selected role state.
- Keeps user update payload construction.
- Keeps role-permission payload construction.

Presentation module:

- `AuthUsersPanelView`
- `CreateUserSection`
- `UsersListSection`
- `RolePermissionSection`
- Local visual helpers: `RoleNote`, `RequiredMark`, `FieldHint`, `UserInitialsAvatar`, `countSelectedPermissions`, `toDomId`, `formatUserDate`.

## State Ownership After Refactor

All state remains parent-owned in `AuthUsersPanel`:

- `newUser`
- `userPasswords`
- `draftPermissions`
- `usersPageSize`
- `usersPage`
- `permissionsExpanded`
- `selectedRole`

Child components receive values and callbacks only.

## Handler Preservation

| Handler | Location after refactor | Preservation |
| --- | --- | --- |
| `handleCreateUser` | Parent | Preserved. |
| `handleUpdateUser` | Parent | Preserved. |
| `handleUserEmailBlur` | Parent | Extracted from previous inline blur payload construction. |
| `handleUserDisplayNameBlur` | Parent | Extracted from previous inline blur payload construction. |
| `handleUserRoleChange` | Parent | Extracted from previous inline select payload construction. |
| `handleUserStatusChange` | Parent | Extracted from previous inline select payload construction. |
| `handleUserPasswordChange` | Parent | Extracted from previous inline password draft update. |
| `handleSaveUserPassword` | Parent | Extracted from previous inline password payload construction. |
| `handleUsersPageSizeChange` | Parent | Extracted from previous inline page-size reset behavior. |
| `togglePermission` | Parent | Preserved. |
| `saveRolePermissions` | Parent | Preserved. |

## Query And Mutation Preservation

The following remain only in `AuthUsersPanel`:

- `useCurrentUser`
- `useAuthUsers`
- `useRolePermissions`
- `useAuthUserMutations`
- `useRolePermissionMutations`
- `authMutations.createUser.mutateAsync(newUser)`
- `authMutations.updateUser.mutateAsync({ userId, payload })`
- `roleMutations.updateRolePermissions.mutateAsync({ role, permissions: draftPermissions[role] ?? [] })`

No hook, query key, mutation, cache invalidation, service call, fetch, route guard, server authorization, auth/session/cookie/token behavior or permission assignment logic was moved into the presentation module.

## Payload Preservation

Create-user payload remains:

```ts
newUser
```

Update-user wrapper remains:

```ts
{ userId, payload }
```

Inline field update payloads remain parent-owned:

```ts
{ email: value }
{ displayName: value }
{ role }
{ status }
{ password: userPasswords[userId] ?? '' }
```

Role-permission payload remains:

```ts
{
  role,
  permissions: draftPermissions[role] ?? []
}
```

## Protected Logic Confirmation

- Authentication provider unchanged.
- User IDs unchanged.
- Email identity behavior unchanged.
- Role codes unchanged.
- Permission keys unchanged.
- Permission codes unchanged.
- Role-permission semantics unchanged.
- User-role mapping unchanged.
- Account status values unchanged.
- Status transitions unchanged.
- Authorization checks unchanged.
- Query keys unchanged.
- Mutations unchanged.
- Cache invalidation unchanged.
- API, service, repository, Prisma and database unchanged.
