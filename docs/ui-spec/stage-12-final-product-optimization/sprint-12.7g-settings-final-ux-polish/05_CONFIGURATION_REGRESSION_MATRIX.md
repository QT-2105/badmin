# Configuration Regression Matrix

## Static Regression

| Check | Result | Notes |
| --- | --- | --- |
| No hard-coded business rule converted to dynamic setting | PASS | No new setting capability added. |
| Configuration keys unchanged | PASS | Presentation only; keys stay in parent/lib. |
| Configuration semantics unchanged | PASS | Toggle and number handlers unchanged. |
| Default values unchanged | PASS | No app-settings file changed. |
| Persistence mechanism unchanged | PASS | No local storage/hook changes. |
| Save payloads unchanged | PASS | Branding save handler unchanged. |
| Reset/destructive behavior unchanged | PASS | Confirmation callbacks unchanged. |
| Runtime algorithms unchanged | PASS | No runtime file changed. |
| Finance calculations unchanged | PASS | No finance calculation file changed. |
| Inventory calculations unchanged | PASS | No inventory file changed. |
| Authentication/authorization unchanged | PASS | No auth/API/middleware file changed. |
| Query keys/mutations/cache invalidation unchanged | PASS | No hook or API file changed. |
| Routes unchanged | PASS | No route file changed. |

## Manual Regression Scope

| Scenario | Result | Notes |
| --- | --- | --- |
| Settings route load | STATIC PASS | Requires browser session for live verification. |
| Direct section navigation | STATIC PASS | Navigation handler unchanged. |
| Club name save | STATIC PASS | Save handler unchanged. |
| Club name reset | STATIC PASS | Reset handler unchanged. |
| Logo upload/delete | STATIC PASS | Input accept and callbacks unchanged. |
| Finance local settings toggle | STATIC PASS | Existing callbacks unchanged. |
| Max court count update | STATIC PASS | Existing callback and normalization source unchanged. |
| Theme toggle | STATIC PASS | Existing `ThemeToggle` unchanged. |
| Match-history reset | STATIC PASS | Existing confirm callback unchanged. |
| Player-image cleanup | STATIC PASS | Existing confirm callback unchanged. |

## Validation

Validation commands are recorded in `06_COMPLETION_REPORT.md`.
