# Users Security Regression Matrix

## Static Regression

| Check | Result | Notes |
| --- | --- | --- |
| Authentication provider unchanged | PASS | No auth provider file changed. |
| Session behavior unchanged | PASS | No session, token or cookie file changed. |
| User IDs unchanged | PASS | No data model or API file changed. |
| Email identity behavior unchanged | PASS | Input blur handler unchanged. |
| Role codes unchanged | PASS | Role options still map existing `USER_ROLES`. |
| Permission keys unchanged | PASS | Permission rows still render existing `PERMISSION_DEFINITIONS`. |
| Account status values unchanged | PASS | Status select still uses `ACTIVE` and `DISABLED`. |
| User-role mapping unchanged | PASS | Role mutation handler unchanged. |
| Role-permission mapping unchanged | PASS | Permission toggle and save handlers unchanged. |
| Server authorization unchanged | PASS | No API, middleware or repository/service file changed. |
| Client visibility behavior unchanged | PASS | Existing props and conditions are preserved. |
| Query keys unchanged | PASS | No hook or query file changed. |
| Mutations unchanged | PASS | No hook or mutation file changed. |
| Payloads unchanged | PASS | Parent payload construction unchanged. |
| Routes unchanged | PASS | No route file changed. |

## Manual Regression Scope

| Scenario | Result | Notes |
| --- | --- | --- |
| Users page load | STATIC PASS | Requires browser session for live verification. |
| User create | STATIC PASS | Submit handler unchanged. |
| User edit | STATIC PASS | Blur/change handlers unchanged. |
| Role selection | STATIC PASS | Select values unchanged. |
| Status selection | STATIC PASS | Select values unchanged. |
| Password update | STATIC PASS | Password save handler unchanged. |
| Permission matrix load | STATIC PASS | Existing definitions and drafts preserved. |
| Permission assignment | STATIC PASS | Toggle/save callbacks unchanged. |
| Unauthorized assignment blocked | STATIC PASS | `selectedRoleLocked` source unchanged. |

## Validation

Validation commands are recorded in `06_COMPLETION_REPORT.md`.
