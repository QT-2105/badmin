# Regression Plan

## Finance Regression

| Scenario | Expected Result | Status |
| --- | --- | --- |
| Finance page renders | Same page shell and sections. | PASS |
| Transaction table columns | Same columns and order. | PASS |
| Desktop table rows | Same row data and formatter output. | PASS |
| Mobile transaction rows | Same columns prop reused by mobile rendering. | PASS |
| Sorting | Existing `sortBy` state and handler unchanged. | PASS |
| Pagination | Existing pagination state and handler unchanged. | PASS |
| Filters | Report period/month/year unchanged. | PASS |
| Create transaction form | Form props and submit handler unchanged. | PASS |
| Totals and profit | Parent calculation unchanged. | PASS |

## Command Regression

| Command | Status |
| --- | --- |
| Immediate `npm run typecheck` after change | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` final | PASS |
| `npm run build` | PASS |
| `npm run guard:no-db-schema-automation` | PASS |
| `git diff --check` | PASS |
| Protected backend/logic diff | PASS |
