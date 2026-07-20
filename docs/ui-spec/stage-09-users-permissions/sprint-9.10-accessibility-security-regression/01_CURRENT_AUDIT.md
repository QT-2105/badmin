# Current Audit

Sprint scope: accessibility hardening and source-level user/security regression for existing capabilities only.

## Accessibility Findings

- Form labels are present for the create-user form and inline user-list controls.
- Required state is visible and decorative required markers are hidden from assistive technology.
- Create/update/role-permission error messages use `role="alert"`.
- Inline edit controls have accessible names, but the grid-based user list needed clearer table/row/cell semantics.
- Status badges include text labels; status is not communicated by color alone.
- Status descriptions needed an explicit `aria-describedby` relationship with the status select.
- Permission checkboxes have visible labels and existing `aria-label` values.
- Permission groups needed explicit group labeling and selected-count descriptions.
- Expand/collapse controls already expose `aria-expanded`.
- Focus-visible behavior is inherited from shared primitives; row focus-within presentation is visual only.
- Reduced-motion presentation was missing on repeated transition-heavy user rows and permission rows.
- Dialog, Drawer, ActionMenu, invitation flow, role CRUD, profile edit, delete/remove, lock/unlock, and reset-password UI are not present in the current Users source, so their accessibility checks are N/A.

## Security Regression Capability Status

- Available: Users page, create user, inline edit email/display name/role/status, admin password update, fixed role notes, role-permission matrix, role-permission save, read-only Owner role behavior, pagination, route guard, middleware, server authorization.
- Partial: current-user profile display through AppShell and `/api/auth/me`.
- Missing / N/A: search, filters, dedicated user detail, invitation flow, role CRUD, permission CRUD, action menu, activate/deactivate action separate from status select, lock/unlock, delete/remove, profile edit, password reset flow, audit/activity stream.

## Source-Level Security Checks

- Permission keys are imported from existing auth constants and were not changed.
- Role codes remain `OWNER`, `MANAGER`, `OPERATOR`, and `VIEWER`.
- User status values remain `ACTIVE` and `DISABLED`.
- Sensitive mutation handlers, payloads, cache invalidation, query keys, route guards, middleware, API handlers, repositories, services, Prisma, and database schema remain outside this sprint's source edits.
