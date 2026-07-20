# Current Audit

Status values:

- ACTIVE
- DISABLED

Actions:

- Create user.
- Inline email/display name save on blur.
- Role/status select change.
- Password save button.
- Save role permissions.

No separate activate/deactivate button, lock/unlock action, resend invite, delete/remove action, reset-password dialog, action menu, or confirmation dialog exists in current source.

## Action Contract Table

| Action | Current status | Result status | Visibility condition | Permission requirement | Self-action restriction | Handler | Payload | Required preservation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Change status to active | `DISABLED` or `ACTIVE` user row | `ACTIVE` when selected | Status select visible per listed user | `/users` requires `users.manage`; update API enforces permission | API prevents unsafe self/Owner changes where applicable | `handleUpdateUser(user.id, { status })` | `{ status: 'ACTIVE' }` | Preserve status value, select handler, payload, API protection, and no confirmation behavior. |
| Change status to disabled | `ACTIVE` or `DISABLED` user row | `DISABLED` when selected | Status select visible per listed user | `/users` requires `users.manage`; update API enforces permission | API prevents self-lock and last-active-owner lock | `handleUpdateUser(user.id, { status })` | `{ status: 'DISABLED' }` | Preserve status value, select handler, payload, API protection, and no confirmation behavior. |
| Save new password | N/A | N/A | Password save button visible per listed user | `/users` requires `users.manage`; update API enforces permission | API/repository validation remains authoritative | `handleUpdateUser(user.id, { password: userPasswords[user.id] ?? '' })` | `{ password }` | Preserve trigger, disabled condition, payload, mutation, and reset-after-save behavior. |
| Save role permissions | N/A | N/A | Visible only for non-`OWNER` selected role | Owner-only through UI disabled condition and API authorization | N/A | `saveRolePermissions(selectedRole)` | `{ role, permissions }` | Preserve visibility, disabled condition, payload, and mutation. |
| Activate/deactivate button | Missing Capability | N/A | N/A | N/A | N/A | N/A | N/A | Do not implement; status select is the current transition UI. |
| Lock/unlock | Missing Capability | N/A | N/A | N/A | N/A | N/A | N/A | Do not implement; only `ACTIVE`/`DISABLED` statuses exist. |
| Resend invite | Missing Capability | N/A | N/A | N/A | N/A | N/A | N/A | Do not implement. |
| Delete/remove user | Missing Capability | N/A | N/A | N/A | N/A | N/A | N/A | Do not implement. |
| Confirmation dialog | Missing Capability | N/A | N/A | N/A | N/A | N/A | N/A | Do not add confirmation because current workflow has none. |

## Presentation Opportunities

- Status badge and helper text can communicate `ACTIVE` versus `DISABLED` more clearly.
- Administrative password action can use clearer hierarchy and accessible text.
- Disabled/loading states can be easier to scan without changing action behavior.
