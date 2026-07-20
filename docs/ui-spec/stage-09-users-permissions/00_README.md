# Stage 09 - User & Permission Management UX

Status: Planning / audit complete. Source implementation has not started.

Stage 09 focuses on the presentation layer for the existing internal user and role-permission administration module.

## Scope

Allowed:

- User management page layout.
- User list readability.
- Existing create/update user form presentation.
- Existing fixed-role permission configuration presentation.
- Status/action presentation.
- Responsive and tablet UX.
- Light/dark parity.
- Accessibility, focus, loading, empty, error, and confirmation presentation.

Not allowed:

- Authentication changes.
- Authorization changes.
- New roles.
- New permission keys.
- Permission semantic changes.
- Session, token, cookie, password, route guard, API, database, Prisma, repository, service, hook, mutation, query key, or cache behavior changes.

## Discovery Summary

Existing capabilities:

- User management: yes, via `/users`.
- Role management: partial, fixed roles only.
- Permission management: yes, role-permission mapping for fixed roles.
- Current-user profile: partial read-only display through current session/user APIs and app shell.
- Password management: admin create/update password exists; password reset/change-own-password does not exist.
- Authentication provider: local database-backed auth with scrypt password hashing and a 24-hour HTTP-only session cookie.
- Route guard: middleware checks session cookie, server pages check permissions.
- API authorization: API routes call auth permission guards.

Missing capabilities:

- Invitation flow.
- Role CRUD.
- Permission CRUD.
- Dedicated current-user profile page.
- Forgot/reset password flow.
- MFA.
- User audit log.

Missing capabilities must remain out of scope unless explicitly requested later.

## Source Baseline

Primary page:

- `src/app/users/page.tsx`
- `src/components/users/auth-users-panel.tsx`

Auth/security infrastructure:

- `middleware.ts`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/auth-users-repository.ts`
- `src/repositories/role-permissions-repository.ts`
- `src/app/api/auth/**`
- `prisma/schema.prisma`

These security and data-contract files are protected for Stage 09.

## Sprint Plan

- Sprint 9.0: Baseline and audit.
- Sprint 9.1: Layout and page structure.
- Sprint 9.2: User list presentation.
- Sprint 9.3: Existing user detail/row detail presentation.
- Sprint 9.4: User form presentation.
- Sprint 9.5: Fixed role management presentation.
- Sprint 9.6: Permission matrix presentation.
- Sprint 9.7: Status and action presentation.
- Sprint 9.8: Current-user profile area, only if existing display is reused.
- Sprint 9.9: Responsive and tablet UX.
- Sprint 9.10: Accessibility and security regression.
- Sprint 9.11: Completion report.

No source code should be changed before a sprint implementation request is explicitly approved.
