# Current Audit

Existing profile-adjacent surfaces:

- App shell current user name and role.
- `/api/auth/me`.
- `useCurrentUser`.

Missing Capability:

- Dedicated profile page.
- Current-user profile edit.
- Change own password.
- Auth-user avatar upload.

## Capability Decision

Status: PARTIAL

The project has a read-only current-user presentation in `src/components/app-shell.tsx`. There is no dedicated profile route, edit form, avatar upload flow, current-user password change flow, profile mutation, or profile-specific API.

## Current User Data Contract

| Surface | Data source | Editable | Notes |
| --- | --- | --- | --- |
| AppShell current user card | `useCurrentUser()` -> `/api/auth/me` | No | Displays current session user only. |
| Display name | `currentUser.displayName` | No | Read-only in AppShell. |
| Email/login name | `currentUser.email` | No | Read-only in AppShell. |
| Role | `currentUser.role` | No | Read-only label only. |
| Status | `currentUser.status` | No | Read-only label only. |
| Permissions | `currentUser.permissions` | No | Not displayed in profile surface. |

## Allowed Presentation Polish

- Improve the AppShell read-only profile surface.
- Add initials avatar generated from existing display name/email.
- Add read-only email, role, and status labels.
- Improve light/dark surface, spacing, and hierarchy.
- Improve collapsed sidebar current-user affordance.

## Out of Scope

- New profile route.
- Editable profile form.
- Email change from profile.
- Avatar upload.
- Change-own-password.
- Role or status editing from profile.
- Permission-management action from profile.
- Any auth/session/query/mutation/API behavior change.
