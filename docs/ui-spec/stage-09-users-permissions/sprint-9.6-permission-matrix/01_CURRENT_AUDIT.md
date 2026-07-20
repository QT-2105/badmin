# Current Audit

Precondition result: Permission management is AVAILABLE for fixed permission keys and PARTIAL for assignment UI.

Permission definitions are code-defined and grouped by domain.

Current UI:

- Role selector.
- Owner lock indicator.
- Permission cards grouped by `group`.
- Checkbox per permission.
- Save button for non-owner roles.

No permission CRUD, search, select-all, parent-child, inherited assignment, or indeterminate behavior exists in current source.

## Permission Matrix Contract

| Permission UI element | Permission key | Source | Selected state source | Disabled condition | Handler | Payload effect | Required preservation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Permission group card | N/A | `PERMISSION_DEFINITIONS.reduce(...item.group...)` | N/A | N/A | None | None | Preserve grouping source and group labels. |
| Permission row label | `item.key` | `PERMISSION_DEFINITIONS` item | N/A | N/A | None | None | Preserve permission key and label; do not add permissions. |
| Permission checkbox checked state | `item.key` | `PERMISSION_DEFINITIONS` item | `selectedRole === 'OWNER' || selectedPermissions.includes(item.key)` | `selectedRoleLocked` | `togglePermission(selectedRole, item.key)` | Updates local `draftPermissions[selectedRole]`; does not persist until save | Preserve checked expression, disabled expression, handler, and direct assignment semantics. |
| Owner read-only permissions | All permission keys | `PERMISSION_DEFINITIONS` | Always checked when `selectedRole === 'OWNER'` | `selectedRoleLocked` is true | `togglePermission` early returns for `OWNER` | None | Preserve Owner full-permission read-only behavior. |
| Non-owner disabled permissions | All permission keys | `PERMISSION_DEFINITIONS` | From `selectedPermissions` | `currentUser?.role !== 'OWNER'` | Disabled checkbox prevents changes | None | Preserve server/API authorization; UI disabled state is not security boundary. |
| Save role permissions | Selected role permissions | `draftPermissions[selectedRole]` | N/A | `currentUser?.role !== 'OWNER' || roleMutations.updateRolePermissions.isPending` | `saveRolePermissions(selectedRole)` | `{ role, permissions: draftPermissions[role] ?? [] }` | Preserve payload, mutation, cache behavior, and Owner-only save. |
| Select-all | N/A | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.6. |
| Indeterminate | N/A | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.6. |
| Permission search | N/A | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.6. |
| Cancel/reset | N/A | Missing Capability | N/A | N/A | N/A | N/A | Do not implement in Sprint 9.6. |

## Presentation Opportunities

- Group headers can show selected/total permission counts.
- Permission rows can make selected and disabled states clearer.
- Permission labels can be easier to scan with consistent row spacing and stronger contrast.
- Owner and non-owner read-only states can be explained visually without changing restrictions.
