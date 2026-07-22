# KPI Card Inventory

## Shared KPI Components

- `src/components/ui/stat-card.tsx`
- `PageSummaryGrid` and legacy `MetricCard` in `src/components/ui/page-layout.tsx`

## Module Inventory

| Module | KPI/Stat surfaces | Component | Notes |
| --- | --- | --- | --- |
| Dashboard | revenue, expense, profit, inventory | `StatCard` | Good semantic tone ownership in caller. |
| Session Workspace | time, player count, expected income, payment summary | `StatCard`, `Surface`, `StatusBadge` | Dense but clear; completion summary needs visual QA. |
| Runtime | total, waiting, just finished, playing | custom `StatPill` | Runtime-specific and protected by operator UX. |
| Finance | income, expense, profit | `StatCard` | Correct semantic tone; no extra KPI invented. |
| Inventory | product count, stock, stock value, usage, sales, total | `StatCard` and `Skeleton` | Strong inventory summary; final long-value QA needed. |
| Users | user count, permission count, role context | custom role cards and badges | Appropriate because these are admin summary blocks, not pure KPIs. |
| Settings | section status and destructive action summaries | custom settings surfaces | Not KPI-driven. |

## Risks

- Runtime `StatPill` is intentionally custom but visually different from `StatCard`.
- Inventory has many summary cards on wide screens; final density check should prevent equal emphasis overload.
- Dashboard chart and KPI relationship needs browser verification.
- KPI values must remain caller-owned; shared components must not receive calculation logic.

## Stage 12 Rule

Any KPI polish may change only:

- spacing
- typography
- icon placement
- semantic presentation
- responsive grid
- loading/empty presentation

It must not change:

- data source
- formulas
- values
- formatting semantics
- status/business meaning

