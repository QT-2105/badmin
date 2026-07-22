# Regression Plan

## Component Regression

| Scenario | Expected Result | Status |
| --- | --- | --- |
| Settings navigation renders all existing items | Same items, same order, same click handler | PASS |
| Capability chip text | Existing status rendered as `Có sẵn` or `Một phần` | PASS |
| Club name dirty state | Same dirty/saved/unchanged state, same text | PASS |
| Branding success/error message | Same message source, semantic status/alert wrapper | PASS |
| Match-history reset message | Same message source, semantic status/alert wrapper | PASS |
| Player-image cleanup message | Same message source, semantic status/alert wrapper | PASS |
| Finance toggles | Same `onChange` callbacks and values | PASS |
| Max court setting | Same input and callback | PASS |
| Theme toggle | Existing component unchanged | PASS |

## Command Regression

| Command | Status |
| --- | --- |
| `npm run typecheck` immediately after change | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run guard:no-db-schema-automation` | PASS |
| `git diff --check` | PASS |
| Protected backend/logic diff | PASS |
