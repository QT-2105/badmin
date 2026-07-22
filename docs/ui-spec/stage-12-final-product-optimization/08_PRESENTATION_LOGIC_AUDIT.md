# Presentation Logic Audit

## Scope

Presentation logic includes formatting, responsive rendering, empty/loading/error state selection, display-only derived labels, and UI-only grouping.

Stage 12 must not move business logic into shared components.

## Current Ownership Pattern

| Module | Current pattern | Status |
| --- | --- | --- |
| Dashboard | Page client owns query and derived chart/KPI data. | Acceptable. |
| Schedule | Page/detail clients own CRUD state and handlers. | Acceptable. |
| Session Workspace | Detail client owns player/completion state and handlers. | Acceptable but large. |
| Runtime | Zustand/runtime components own protected live presentation. | Protected. |
| Finance | Parent owns query/filter/sort/totals/mutation; presentation renders. | Good. |
| Inventory | Parent owns query/mutation/forms/totals; presentation renders. | Good with notes. |
| Users | Parent owns auth hooks/mutations/permission state; presentation renders. | Good. |
| Settings | Parent owns settings hooks/local state/destructive actions; presentation renders. | Good. |

## Static Presentation Boundary Notes

- `finance-presentation.tsx`, `inventory-presentation.tsx`, `settings-presentation.tsx`, and `auth-users-presentation.tsx` are presentation modules.
- `inventory-presentation.tsx` contains display estimation helpers for outbound quantities. These are presentation previews only and must not become inventory calculation source of truth.
- No Stage 12 shared UI component should call queries, mutations, repositories, services, API routes, or auth checks.

## Stage 12 Optimization Candidates

Only with baseline/regression:

- memoize expensive presentation-only lists if measurable render issue exists
- move display-only helpers out of huge files if it reduces maintainability risk
- reduce repeated date/currency formatting in hot render paths
- keep all mutation payload construction in parent/container modules

## Out of Scope

- Refactoring Runtime store.
- Changing sorting/filtering.
- Changing payloads.
- Moving finance/inventory calculations into UI.
