# Performance Opportunity Report

## Current Baseline

The project has no dedicated performance test script or browser profiling baseline.

Static scan found:

- large presentation files
- several `useMemo` usages for derived lists/totals
- limited `useCallback`
- no `React.memo` usage in app-specific components
- no obvious `window.confirm` or `window.alert` in `src`
- no E2E/browser tooling in `package.json`

## Opportunities

| Area | Opportunity | Risk | Required baseline before code |
| --- | --- | --- | --- |
| Inventory presentation | Split display-only subcomponents further | Medium | line count map, handler map, payload comparison. |
| Users permission matrix | Consider smaller display-only rows/groups | Medium | permission key/checked state preservation proof. |
| Session Workspace | Extract player list/completion sections | Medium | handler and mutation payload map. |
| Runtime | Avoid broad performance refactor | High | only measure and fix confirmed render bottlenecks. |
| Finance | DataTable already scoped; minor formatter cleanup possible | Low | value formatting before/after comparison. |
| Dashboard | Chart rendering can remain static/simple | Low | screenshot and data value comparison. |

## Non-Goals

- adding lazy loading without measured bundle/render benefit
- replacing React Query behavior
- changing Zustand state shape
- changing query invalidation
- adding memoization to quiet theoretical concerns

## RC Recommendation

Treat performance work as targeted polish only. The bigger RC value is visual/device/browser QA and protected regression confirmation.

