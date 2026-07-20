# Discovery Gate

## Discovery Results

| Check | Result | Evidence | Stage 09 Decision |
| --- | --- | --- | --- |
| User management | Exists | `/users`, `AuthUsersPanel`, `/api/auth/users` | Presentation-only UX work allowed. |
| Role management | Partial | `USER_ROLES = OWNER, MANAGER, OPERATOR, VIEWER` | Fixed-role presentation only. No role CRUD. |
| Permission management | Exists | `PERMISSION_DEFINITIONS`, `app_role_permissions`, `/api/auth/role-permissions` | Matrix/list presentation only. No permission key changes. |
| Current-user profile | Partial | App shell shows current user; `/api/auth/me`; `useCurrentUser` | Read-only current-user display only if already present. No profile edit feature. |
| Invitation flow | Missing | No invite route/service/schema found | Missing Capability. Future Scope only. |
| Password management | Partial | Create user password, update user password, login password verification | Admin password fields only. No reset/change-own-password flow. |
| Authentication provider | Exists | Local DB-backed auth with `app_users`, `auth_sessions`, scrypt hashes, HTTP-only cookie | Must not change. |
| Authorization checks | Exists | `hasPermission`, `requirePageUser`, `requireApiPermission`, app-shell nav filtering | Must not change. |
| Route guard | Exists | `middleware.ts` protects route prefixes by session cookie; pages enforce permission | Must not change. |
| Missing capabilities | Multiple | No role CRUD, permission CRUD, invitation, profile edit, MFA, reset password, audit log | Document as Missing Capability / Future Scope only. Do not implement. |

## Existing Roles

- `OWNER` - Chủ CLB.
- `MANAGER` - Quản lý.
- `OPERATOR` - Điều phối.
- `VIEWER` - Chỉ xem.

These role values are security-sensitive and must not be renamed, added to, or removed during Stage 09.

## Existing Permission Keys

- `dashboard.view`
- `schedule.view`
- `schedule.manage`
- `session.view`
- `session.operate`
- `session.complete`
- `finance.view`
- `finance.manage`
- `inventory.view`
- `inventory.manage`
- `settings.manage`
- `users.manage`

These permission keys are security-sensitive and must remain unchanged.

## Existing Account Status Values

- `ACTIVE`
- `DISABLED`

Stage 09 may improve badge presentation only.

## Authentication Provider Baseline

- User rows live in `app_users`.
- Password hashes use `scrypt`.
- Sessions live in `auth_sessions`.
- Session cookie name is `badmin_session`.
- Session max age is 24 hours.
- Login rate limiting is implemented in memory.

## Missing Capability Log / Future Scope

| Capability | Status | Future Architecture Note |
| --- | --- | --- |
| Invitation flow | Missing | Requires separate product/security approval. |
| Role CRUD | Missing | Current roles are fixed operational roles. |
| Permission CRUD | Missing | Current permission keys are code-defined. |
| Profile editing | Missing | Could be a future current-user profile module. |
| Forgot/reset password | Missing | Requires secure token, email/SMS, expiry, and audit design. |
| MFA | Missing | Requires auth architecture expansion. |
| User audit log | Missing | Requires audit table and compliance policy. |

All missing capabilities are out of scope for Stage 09 implementation. Do not create UI, routes, API, schema, services, hooks, shared component logic, or permissions for these capabilities during Stage 09.
