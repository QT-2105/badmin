# Authorization Workflow Baseline

## Bootstrap

1. `/api/auth/bootstrap` returns `needsBootstrap` based on `countAuthUsers()`.
2. If no users exist, bootstrap POST creates the first `OWNER`.
3. Bootstrap creates an auth session and sets `badmin_session`.

## Login

1. Login page submits login name and password.
2. `/api/auth/login` normalizes login name to lower-case.
3. Login rate limit key is IP plus login name.
4. User must exist and have `ACTIVE` status.
5. Password is verified with `scrypt`.
6. Successful login creates a session row and HTTP-only cookie.
7. `last_login_at` is touched.

## Session

1. Session token is stored raw in `badmin_session`.
2. Database stores `sha256` token hash.
3. Max age is 24 hours.
4. Expired sessions are rejected and may be deleted.
5. Disabled users cannot resolve as current users.

## Route Guard

1. `middleware.ts` checks protected route prefixes for cookie presence.
2. If cookie is missing, user is redirected to `/login?next=...`.
3. Server pages call `requirePageUser(pathname)`.
4. Page guard loads permissions and redirects unauthorized users to `/dashboard`.

## API Guard

1. API routes read the auth cookie.
2. `requireApiUser` verifies a valid session and optional role list.
3. `requireApiPermission` verifies a permission key through `hasPermission`.
4. Auth failures return 401 or 403 through `authErrorResponse`.

## Users Management

1. `/users` requires `users.manage`.
2. GET `/api/auth/users` requires `users.manage`.
3. POST `/api/auth/users` requires `users.manage`; only `OWNER` can create another `OWNER`.
4. PATCH `/api/auth/users/[userId]` requires `users.manage`.
5. Non-owner users cannot edit owner accounts or assign owner role.
6. A user cannot self-disable or self-demote away from owner.
7. The last active owner cannot be disabled or demoted.

## Role Permissions

1. GET `/api/auth/role-permissions` requires `users.manage`.
2. PATCH `/api/auth/role-permissions` requires role `OWNER`.
3. `OWNER` always receives all permissions.
4. Non-owner roles read from `app_role_permissions` or fallback to defaults.
5. Permission keys are normalized against code-defined definitions.

This baseline is protected. Stage 09 presentation work must not change it.
