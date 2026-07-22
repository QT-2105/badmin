# Sprint 11.13C — Users Presentation Refactor Regression Report

## Scope

Regression focused on source-level preservation after Users presentation decomposition.

## Source Regression

| Area | Result | Evidence |
| --- | --- | --- |
| Current user query | PASS | `useCurrentUser` remains in `AuthUsersPanel`. |
| User list query | PASS | `useAuthUsers` remains in `AuthUsersPanel`. |
| Role-permission query | PASS | `useRolePermissions` remains in `AuthUsersPanel`. |
| User mutations | PASS | `useAuthUserMutations` and all user `mutateAsync` calls remain in `AuthUsersPanel`. |
| Role-permission mutation | PASS | `useRolePermissionMutations` and role-permission payload remain in `AuthUsersPanel`. |
| Create user payload | PASS | `newUser` payload remains parent-owned. |
| Update user payloads | PASS | Email, display name, role, status and password payload construction remain parent-owned. |
| Password draft clearing | PASS | Password draft is still cleared after password update in `handleUpdateUser`. |
| Permission draft ownership | PASS | `draftPermissions` and `togglePermission` remain parent-owned. |
| OWNER lock behavior | PASS | `togglePermission` still returns early for `OWNER`; selected-role lock remains parent-derived. |
| Presentation module isolation | PASS | No hook, query, mutation, service call, fetch, localStorage, window/document logic is present in `auth-users-presentation.tsx`. |

## Validation Results

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run guard:no-db-schema-automation` | PASS |
| `git diff --check` | PASS |

## Protected Diff

Command checked:

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Result: no output.

## UI Behavior Comparison

| UI area | Result |
| --- | --- |
| Create-user role notes | Preserved. |
| Create-user form | Preserved; state and submit handler stay in parent. |
| User list pagination | Preserved; page-size reset and page state stay in parent. |
| User email/display-name inline edit | Preserved; payload construction stays in parent. |
| User role/status select | Preserved; payload construction stays in parent. |
| Password update | Preserved; password draft and payload stay in parent. |
| Permission matrix expand/collapse | Preserved. |
| Selected role summary | Preserved. |
| Permission checkbox UI | Preserved; permission draft mutation stays in parent. |
| Role-permission save | Preserved; payload construction stays in parent. |

## Manual Browser QA

Not executed in this sprint. Deferred to Stage 11 final browser/device QA.

## Final Regression Result

PASS WITH NOTES
