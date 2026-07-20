# Sprint 9.0 - Current Audit

Completed baseline discovery for the current user, auth, role, and permission capabilities.

## Discovery

| Area | Current Source | Status | Stage 09 Decision |
| --- | --- | --- | --- |
| User routes | `/users`, `/login` | Exists | Presentation-only work allowed. |
| User pages | `src/app/users/page.tsx`, `src/app/login/page.tsx` | Exists | `/users` is Stage 09 scope; login is protected auth surface and only audited. |
| User API | `src/app/api/auth/users/route.ts`, `src/app/api/auth/users/[userId]/route.ts` | Exists | Protected. Do not edit. |
| Current user API | `src/app/api/auth/me/route.ts` | Exists | Protected. Do not edit. |
| Role permissions API | `src/app/api/auth/role-permissions/route.ts` | Exists | Protected. Do not edit. |
| Bootstrap API | `src/app/api/auth/bootstrap/route.ts` | Exists | Protected. Do not edit. |
| Login/logout API | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts` | Exists | Protected. Do not edit. |
| User repository | `src/repositories/auth-users-repository.ts` | Exists | Protected. Do not edit. |
| Role permission repository | `src/repositories/role-permissions-repository.ts` | Exists | Protected. Do not edit. |
| User service | `src/services/auth-service.ts` | Exists | Protected. Do not edit. |
| User hooks | `src/hooks/use-auth.ts` | Exists | Protected. Do not edit. |
| Query keys | `['auth','me']`, `['auth','bootstrap']`, `['auth','users']`, `['auth','role-permissions']` | Exists | Must remain unchanged. |
| Mutations | bootstrap owner, login, logout, create user, update user, update role permissions | Exists | Must remain unchanged. |
| Validation | Repository/API validation for login name, display name, password length, role/status normalization, owner safeguards | Exists | Protected. |
| Authentication provider | Local DB-backed auth with `app_users`, `auth_sessions`, scrypt password hashes | Exists | Must remain unchanged. |
| Session mechanism | `badmin_session` HTTP-only cookie, token hash in DB, 24-hour max age | Exists | Must remain unchanged. |
| Middleware | `middleware.ts` checks cookie presence for protected prefixes | Exists | Must remain unchanged. |
| Route guard | `requirePageUser(pathname)` in server pages | Exists | Must remain unchanged. |
| Permission guard | `requireApiUser`, `requireApiPermission`, `hasPermission` | Exists | Must remain unchanged. |
| Role model | Fixed code values: OWNER, MANAGER, OPERATOR, VIEWER | Exists | No role CRUD. |
| Permission model | Code-defined `PERMISSION_DEFINITIONS` | Exists | No permission CRUD. |
| User-role relation | `app_users.role` string | Exists | Must remain unchanged. |
| Role-permission relation | `app_role_permissions.role` + JSON `permissions` | Exists | Must remain unchanged. |
| Account status values | ACTIVE, DISABLED | Exists | Presentation-only badge/status work allowed. |
| Profile page | None | Missing Capability | Future Scope only. |
| Invitation flow | None | Missing Capability | Future Scope only. |
| Password flow | Login, bootstrap, admin create/update password | Partial | No reset/change-own-password work. |
| Avatar flow | No auth-user avatar flow; app shell uses initials | Missing Capability | Future Scope only. |
| Audit/activity data | None found for auth-user actions | Missing Capability | Future Scope only. |

## UI Audit

| Surface | Current State | Finding |
| --- | --- | --- |
| Users page | PageHeader + AuthUsersPanel | Present and permission guarded. |
| Header | Uses `PageHeader` | Copy is clear enough; can be refined later. |
| Toolbar | No dedicated toolbar | Missing; do not invent filters/actions without approval. |
| Search | None | Missing Capability for Stage 09 implementation unless explicitly requested. |
| Filters | Page-size selector only | No role/status/search filter exists. |
| User list | Manual grid table with horizontal scroll | P1 readability/density/shared component opportunity. |
| User row/card | Inline inputs and selects | P1 implicit save behavior needs clearer presentation without behavior change. |
| Avatar | No auth-user avatar; initials only in AppShell current user | Missing Capability for auth-user list. |
| Role badge | Role shown as select, not badge | P1 presentation opportunity. |
| Status badge | Status shown as select, not badge | P1 presentation opportunity, but values must not change. |
| User detail | No dedicated detail | Missing Capability; row metadata only. |
| User create form | Existing inline form | P1 grouping and helper text opportunity. |
| User edit form | Inline row controls | P1 readability/focus opportunity. |
| Role list | Role note cards and role select | P1 hierarchy opportunity. |
| Role form | No role CRUD form | Missing Capability. |
| Permission Matrix | Permission group cards with checkboxes | Exists; P1 density/focus/disabled-state opportunity. |
| Administrative actions | Create, inline update, password save, save role permissions | Exists; protected handlers. |
| Current-user profile | AppShell read-only display | Partial only. |
| Loading state | React Query implicit; no strong loading skeleton in panel | P1/P2 opportunity. |
| Empty state | User list empty state exists | Present. |
| Error state | Mutation error text exists | P1 presentation opportunity. |
| Success feedback | No explicit success feedback beyond data refresh | P2 opportunity, but do not add workflow. |
| Confirmation dialogs | None for user changes | Do not add confirmation that changes workflow. |
| Light mode | Token-based mostly | Needs later browser QA. |
| Dark mode | Token-based mostly | Needs later browser QA. |
| Desktop | Dense but usable | P1 readability. |
| Tablet landscape | Horizontal list scroll likely usable | Needs later QA. |
| Tablet portrait | Dense inline controls may be cramped | P1 responsive risk. |
| Mobile | Smoke only; table scroll required | P1 responsive risk. |
| Keyboard | Native controls present | Needs later focus-order audit. |
| Focus | Shared controls likely provide focus | Needs later QA. |
| Contrast | Token-based | Needs later light/dark QA. |
| Screen-reader labeling | Some inputs have aria-label; permission labels wrap checkbox | Needs later audit. |
| Shared component usage | Button/Input/Select/Checkbox/SectionCard/StatusBadge/Pagination/EmptyState | Good baseline, DataTable adoption optional/risky due inline edit behavior. |

## Dependency Graph

```
Users Page
-> PageHeader
-> AuthUsersPanel
-> useCurrentUser / useAuthUsers / useRolePermissions
-> auth-service
-> /api/auth/me / /api/auth/users / /api/auth/role-permissions
-> auth repositories
-> prisma.app_users / prisma.app_role_permissions
```

```
User List
-> sortedUsers useMemo
-> client-side pagination
-> visibleUsers
-> inline Input/Select controls
-> handleUpdateUser
-> useAuthUserMutations.updateUser
```

```
User Form
-> newUser state
-> handleCreateUser
-> useAuthUserMutations.createUser
-> createAuthUser service
-> POST /api/auth/users
```

```
Role UI
-> USER_ROLES
-> getRoleLabel
-> selectedRole state
-> rolePermissions query
```

```
Permission Matrix
-> PERMISSION_DEFINITIONS
-> permissionGroups useMemo
-> draftPermissions state
-> togglePermission
-> saveRolePermissions
-> useRolePermissionMutations.updateRolePermissions
```

```
Status Action
-> user.status
-> handleUpdateUser({ status })
-> PATCH /api/auth/users/[userId]
-> server authorization and owner/self-protection checks
```

## Classification

### P0

No current P0 defect was introduced or found requiring immediate code changes in this documentation sprint.

P0 risks for future implementation:

- UI accidentally implies non-owner can save role permissions.
- UI changes action visibility in a way that creates privilege-escalation risk.
- UI changes role/status option values or payload mapping.
- UI hides server-side protection assumptions and treats visibility as security.
- Tablet layout makes sensitive actions hard to understand or easy to mis-tap.
- Accessibility labels make role/status/password actions ambiguous.

### P1

- User list hierarchy and table readability.
- User form grouping and helper copy.
- Inline edit save-on-blur discoverability.
- Role presentation and status presentation.
- Permission grouping density and disabled-state clarity.
- Shared component adoption where it does not alter callbacks.
- Loading/error state consistency.
- Tablet and mobile density.

### P2

- Hover states.
- Microcopy polish.
- Motion restraint.
- Visual polish of role notes and permission cards.

## Related Baseline Docs

- `../../02_DISCOVERY_GATE.md`
- `../../03_USER_PERMISSION_SAFETY_CONTRACT.md`
- `../../04_CURRENT_MODULE_AUDIT.md`
- `../../05_AUTHORIZATION_WORKFLOW_BASELINE.md`
