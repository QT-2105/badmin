# KPI and Statistic Card Audit

## Current KPI Surfaces

| Module | Component | Status |
| --- | --- | --- |
| Dashboard | `StatCard` in `PageSummaryGrid` | Good RC baseline. |
| Session Workspace | `StatCard` in session summary | Good RC baseline. |
| Runtime | Custom `StatPill` / runtime stats | Protected custom operational presentation. |
| Finance | `StatCard` in `FinanceSummary` | Good RC baseline after presentation refactor. |
| Inventory | `StatCard` in `InventorySummary` | Good RC baseline after presentation refactor. |
| Users | Role summary cards and permission counts | Custom, acceptable due inline management workflow. |
| Settings | Preference cards/sections | Custom, acceptable for settings IA. |

## Strengths

- `StatCard` centralizes most business KPI visual treatment.
- Income/expense/profit/inventory tones are available.
- Numeric values use currency formatting helpers where needed.
- Loading skeletons are used in Inventory KPI grid.

## Risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Runtime stats are not `StatCard`. | P2 | Intentional because Runtime needs denser tablet layout. |
| Dashboard chart/KPI relationship needs screenshot QA. | P1 | Ensure chart does not visually overpower KPI. |
| Long currency values need viewport QA. | P1 | Especially Dashboard, Finance and Inventory. |
| Inventory has six KPI cards. | P2 | Good information density but should be checked on 820px tablet portrait and mobile. |

## Stage 12 Recommendation

Do not redesign KPI cards. Limit Stage 12 to polish backed by screenshot evidence:

- typography alignment
- value truncation/wrapping
- long currency handling
- tone consistency
- loading skeleton density
