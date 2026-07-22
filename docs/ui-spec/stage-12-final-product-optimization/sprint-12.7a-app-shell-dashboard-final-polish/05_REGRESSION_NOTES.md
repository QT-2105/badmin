# Sprint 12.7A Regression Notes

## App Shell Regression

Confirmed by source scope:

- Root navigation labels and targets unchanged.
- Runtime is not added to root navigation.
- Permission visibility still uses existing `hasPermission` filtering.
- Collapsed state persistence in `localStorage` unchanged.
- Logout handler unchanged.

## Dashboard Regression

Confirmed by source scope:

- `useDashboardSummary` call unchanged.
- Report period, month and year state unchanged.
- KPI values unchanged.
- Chart max and bar value calculations unchanged.
- Recent session row links unchanged.
- No new player statistics, chart, query or backend field added.

## Deferred

- Browser screenshot QA for light/dark/tablet remains deferred.

## Command Validation

- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run guard:no-db-schema-automation`, `git diff --check`, and protected backend/logic diff passed.
