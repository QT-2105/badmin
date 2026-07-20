# Current Audit

Current source exposes inline row editing but no standalone user detail page, drawer, or dialog.

Missing Capability:

- Dedicated user detail.

## Section Baseline

| Section | Data source | Visibility condition | Permission requirement | Required preservation |
| --- | --- | --- | --- | --- |
| Profile header | Not implemented as a detail surface | N/A | N/A | Do not create new detail capability in Sprint 9.3. |
| Avatar presentation | Row initials avatar from `displayName`/`email` added in Sprint 9.2 | Visible inside user list row | `/users` page requires `users.manage` | Keep presentation-only initials; no auth-user avatar field. |
| User identity information | Existing row fields: `email`, `displayName` | Visible for each listed user | `/users` page requires `users.manage` | Preserve inline edit behavior and payloads. |
| Contact information | `email` only | Visible in row input | `/users` page requires `users.manage` | Do not add phone/contact fields. |
| Role presentation | `user.role`, fixed role values | Visible in row role select/badge | `/users` page requires `users.manage` | Preserve role values and handler. |
| Permission summary | No per-user permission summary exists; role permissions are configured separately | N/A | Role permission save is Owner-only | Do not infer permissions beyond role-permission API. |
| Account status | `user.status` | Visible in row status select/badge | `/users` page requires `users.manage` | Preserve status values and handler. |
| Metadata | `createdAt`, `lastLoginAt` currently available | Visible in user list activity column after Sprint 9.2 | `/users` page requires `users.manage` | Preserve formatter and data source. |
| Updated date | `updatedAt` exists in data shape but not shown in current row | Not currently shown | `/users` page requires `users.manage` | Do not add new detail surface just to show it. |
| Activity section | No activity/audit data source exists | N/A | N/A | Missing Capability / Future Scope. |
| Administrative actions | Existing inline create/update/password/permission actions | Existing row/section controls | `/users` page requires `users.manage`; server guards remain authoritative | Preserve handlers, arguments, and server authorization. |
| Loading/empty/error states | Partial list empty and mutation errors exist | Existing section states | `/users` page requires `users.manage` | Future sprint may improve states without changing data. |

## Decision

Sprint 9.3 will not create a new detail route, drawer, dialog, query, or API. Any dedicated user detail/profile surface is a Missing Capability and Future Scope.
