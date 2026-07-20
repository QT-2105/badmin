# Current Audit

Create user form fields:

- `email` used as login name.
- `displayName`.
- `password`.
- `role`.

Update row fields:

- `email`.
- `displayName`.
- `role`.
- `status`.
- `password`.

## Field Contract Table

| Field | Data key | Field type | Default value | Validation | Option values | Payload mapping | Visibility condition | Permission requirement | Required preservation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create login name | `newUser.email` | text input | `''` | Existing API/server validation; UI does not normalize | N/A | `createUser(newUser).email` | Create-user form is visible on `/users` | `/users` requires `users.manage`; server auth remains authoritative | Keep key, input type, autoComplete, default, payload, and email/login behavior unchanged. |
| Create display name | `newUser.displayName` | text input | `''` | Existing API/server validation | N/A | `createUser(newUser).displayName` | Create-user form is visible on `/users` | `/users` requires `users.manage` | Keep key, default, payload, and name behavior unchanged. |
| Create password | `newUser.password` | password input | `''` | Existing backend/password validation | N/A | `createUser(newUser).password` | Create-user form is visible on `/users` | `/users` requires `users.manage` | Do not add/remove password field or change password flow. |
| Create role | `newUser.role` | select | `OPERATOR` | Existing API/server validation | `USER_ROLES`: `OWNER`, `MANAGER`, `OPERATOR`, `VIEWER` | `createUser(newUser).role` | Create-user form is visible on `/users` | `/users` requires `users.manage` | Keep default role, option values, labels, and payload unchanged. |
| Edit login name | `user.email` | text input | Current persisted user email/login name | Existing API/server validation | N/A | `handleUpdateUser(user.id, { email })` on blur when changed | Visible per user row | `/users` requires `users.manage`; update API enforces permission | Keep blur behavior, comparison, payload shape, and login identity semantics unchanged. |
| Edit display name | `user.displayName` | text input | Current persisted display name | Existing API/server validation | N/A | `handleUpdateUser(user.id, { displayName })` on blur when changed | Visible per user row | `/users` requires `users.manage`; update API enforces permission | Keep blur behavior, comparison, payload shape, and name semantics unchanged. |
| Edit role | `user.role` | select | Current persisted role | Existing API/server validation | `USER_ROLES`: `OWNER`, `MANAGER`, `OPERATOR`, `VIEWER` | `handleUpdateUser(user.id, { role })` on change | Visible per user row | `/users` requires `users.manage`; update API enforces permission | Keep role codes, option values, payload, and permission behavior unchanged. |
| Edit status | `user.status` | select | Current persisted status | Existing API/server validation | `ACTIVE`, `DISABLED` | `handleUpdateUser(user.id, { status })` on change | Visible per user row | `/users` requires `users.manage`; update API enforces permission | Keep status codes, labels, payload, and self/security restrictions unchanged. |
| Set new password | `userPasswords[user.id]` | password input | `''` per user row | Existing backend/password validation; button disabled when empty | N/A | `handleUpdateUser(user.id, { password })` on save | Visible per user row | `/users` requires `users.manage`; update API enforces permission | Do not add/remove password field, change submit trigger, or change reset-after-save behavior. |

## Capability Notes

- No invitation flow exists in current source.
- No cancel button exists in current create/edit user flow.
- User edit is inline row editing, not a dialog/drawer/detail route.
- Sprint 9.4 may improve grouping, labels, helper text, disabled/loading presentation, and accessibility attributes only.
