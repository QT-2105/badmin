# Current Audit

Precondition result: Role management is PARTIAL.

Roles are code-defined:

- OWNER
- MANAGER
- OPERATOR
- VIEWER

The UI displays role notes and selects roles for user create/update and permission configuration.

No role CRUD exists.

## Action Contract Table

| Action | Role type | Visibility condition | Permission requirement | Handler | Payload | Required preservation |
| --- | --- | --- | --- | --- | --- | --- |
| View fixed role notes | System fixed roles: `OWNER`, `MANAGER`, `OPERATOR`, `VIEWER` | Always visible in create-user section | `/users` requires `users.manage` | None | None | Keep roles informational only; do not add CRUD or mutate role data. |
| Select create-user role | System fixed roles | Create-user form visible | `/users` requires `users.manage`; server auth remains authoritative | `setNewUser((current) => ({ ...current, role }))` | Role code in create-user payload | Preserve role values, default role, and payload mapping. |
| Select user row role | System fixed roles | Visible per user row | `/users` requires `users.manage`; update API enforces permission | `handleUpdateUser(user.id, { role })` | `{ role }` | Preserve values, handler timing, and payload. |
| Select role for permission configuration | System fixed roles | Permission section expanded | `/users` requires `users.manage`; save remains Owner-protected | `setSelectedRole(role)` | None until save | Preserve local selector state and role values. |
| Save role permissions | Non-owner fixed roles only | Hidden for `OWNER`; visible for non-owner selected role | `currentUser?.role === 'OWNER'`; API guard remains authoritative | `saveRolePermissions(selectedRole)` | `{ role, permissions }` | Preserve Owner lock, payload, mutation, and permission guard. |
| Owner permission display | `OWNER` system role | Permission section expanded and `OWNER` selected | `/users` requires `users.manage` | None for save; checkbox disabled | None | Preserve Owner full-permission meaning and no-save behavior. |
| Create role | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.5. |
| Edit role | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.5. |
| Delete role | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.5. |

## Presentation Opportunities

- Role cards can show existing role label, description, system-role status, user count, and permission count.
- Permission configuration can show selected role context more clearly.
- Owner immutability can be presented as a protected system-role rule without changing behavior.
