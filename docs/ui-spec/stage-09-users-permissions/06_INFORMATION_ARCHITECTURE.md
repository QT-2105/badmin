# Information Architecture

## Priority Order

1. Page header: explain this is internal access management.
2. Create user form: short, dense, operational.
3. User list: primary management surface.
4. Role permission configuration: secondary but high-risk control.
5. Missing capability notes: docs only, not in UI unless explicitly requested.

## Proposed Page Structure

```
PageHeader
UserCreateForm Section
UserList Section
RolePermissionConfig Section
```

## User List Information Priority

1. Login name.
2. Display name.
3. Role.
4. Status.
5. Last login.
6. Password update action.
7. Save/update state.

## Role Permission Information Priority

1. Selected role.
2. Owner locked state.
3. Count of active permissions.
4. Permission groups.
5. Permission checkbox rows.
6. Save action.

## Missing Capability Handling

Do not add UI for:

- Invitations.
- Role creation.
- Permission creation.
- Profile editing.
- Password reset.
- MFA.
- Audit logs.

These are future architecture candidates, not Stage 09 UI scope.
