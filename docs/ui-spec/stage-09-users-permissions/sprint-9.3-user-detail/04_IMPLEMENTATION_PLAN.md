# Implementation Plan

## Section Preservation Table

| Section | Data source | Visibility condition | Permission requirement | Required preservation |
| --- | --- | --- | --- | --- |
| Profile header | Missing | N/A | N/A | Do not implement. |
| Avatar | Existing list-row initials only | User row visible | `/users` requires `users.manage` | No avatar data model/API. |
| Identity | `user.email`, `user.displayName` | User row visible | `/users` requires `users.manage` | Keep inline edit handlers. |
| Contact | `user.email` only | User row visible | `/users` requires `users.manage` | Do not add fields. |
| Role | `user.role` | User row visible | `/users` requires `users.manage` | Preserve role values and payload. |
| Permission summary | Missing per-user summary | N/A | N/A | Do not infer permissions client-side. |
| Account status | `user.status` | User row visible | `/users` requires `users.manage` | Preserve status values and payload. |
| Metadata | `createdAt`, `lastLoginAt` | Existing list activity column | `/users` requires `users.manage` | Preserve formatter/data source. |
| Activity | Missing audit/activity source | N/A | N/A | Future Scope. |
| Admin actions | Existing inline handlers | Existing controls | Server authorization remains authoritative | Preserve handlers and arguments. |

1. Do not create a new user detail route.
2. Do not create new detail API.
3. If needed, improve existing row metadata presentation only.
4. Keep all inline update handlers unchanged.
5. Run lint and typecheck.

## Implementation Decision

No source-code change is required for Sprint 9.3 because a dedicated User Detail capability does not exist in the current source. The safe outcome is to document this as Missing Capability / Future Scope and preserve the existing list-row presentation from Sprint 9.2.
