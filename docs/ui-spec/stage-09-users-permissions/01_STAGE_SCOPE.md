# Stage Scope

## Objective

Improve the presentation layer and administration UX for existing user, role, and permission management.

## In Scope

- Page header and page layout.
- User creation form presentation.
- User list/table presentation.
- Role notes and fixed-role selector presentation.
- Role-permission matrix presentation.
- Status badge/action hierarchy.
- Loading, empty, and error presentation.
- Light/dark token consistency.
- Responsive behavior for desktop, tablet, and mobile.
- Keyboard and focus presentation.

## Out of Scope

- Authentication provider changes.
- Authorization changes.
- Security policy changes.
- Role CRUD.
- Permission CRUD.
- Invitations.
- Profile editing.
- Password reset.
- MFA.
- Audit logs.
- Any database, Prisma, API, repository, service, hook, mutation, query-key, route, permission, validation, session, cookie, token, or password behavior changes.

## Protected Behavior

The current workflow must remain:

1. Owner/bootstrap creates the first account if the system has no users.
2. User logs in with local credentials.
3. A 24-hour session cookie is created.
4. Middleware checks presence of the session cookie for protected routes.
5. Server pages call `requirePageUser`.
6. API routes call `requireApiUser` or `requireApiPermission`.
7. `/users` exposes internal user creation/update and fixed role-permission mapping to authorized users.

No Stage 09 UI task may change the above flow.
