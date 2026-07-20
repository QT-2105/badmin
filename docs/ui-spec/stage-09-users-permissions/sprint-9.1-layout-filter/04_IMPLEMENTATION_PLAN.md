# Implementation Plan

## Control Baseline

| Control | Current value source | Current handler | Current query effect | Permission dependency | Required preservation |
| --- | --- | --- | --- | --- | --- |
| Search | Not implemented | Not implemented | None | N/A | Do not add search in Sprint 9.1. |
| Role filter | Not implemented | Not implemented | None | N/A | Do not add role filter in Sprint 9.1. |
| Status filter | Not implemented | Not implemented | None | N/A | Do not add status filter in Sprint 9.1. |
| Page size | `usersPageSize` local state, default `10` | `setUsersPageSize(Number(event.target.value) as PageSize)` and `setUsersPage(1)` | None; client-side visible rows only | `/users` page already requires `users.manage` | Preserve options, default, pagination reset, and no URL/query effect. |
| Permission role selector | `selectedRole` local state, default `MANAGER` | `setSelectedRole(event.target.value as UserRole)` | None | Save remains owner-only through disabled state and API guard | Preserve role values and no query effect. |

There is no existing search state, search handler, search debounce, role filter state, status filter state, query parameter, URL state, or server query effect in the current Users page. Sprint 9.1 must not add any of these.

1. Preserve `requirePageUser('/users')`.
2. Keep the same components and data flow.
3. Tune only spacing, section surfaces, and header/description presentation.
4. Do not add new filters or query behavior.
5. Run lint and typecheck.
