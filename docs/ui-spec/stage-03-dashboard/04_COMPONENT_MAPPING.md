# Component Mapping

## Current to Target

| Current Dashboard Area | Current Component/Pattern | Stage 03 Target | Rules |
| --- | --- | --- | --- |
| Page shell | `PageShell` | Keep | Do not change page route or app shell. |
| Page header | `PageHeader` | Keep | Keep quick action route targets. |
| Report period | `ToolbarCard` + `Select` + `Input` | `FilterBar` + existing form controls | Preserve local period/month/year state and handlers. |
| Loading notice | `NoticeCard` | `LoadingState` or keep if safer | Do not change query behavior. |
| Error notice | `NoticeCard tone="danger"` | `ErrorState` or keep if safer | Preserve error message. |
| KPI cards | `MetricCard` | `StatCard` | Preserve values, helpers, tones, and formatting. |
| Cashflow chart | local bar chart | Keep local chart initially | Preserve `dailyFinance` and `chartMax` logic. |
| Cost breakdown | local `BreakdownRow` | Keep or polish locally | Preserve cost categories and amounts. |
| Alerts | linked local cards | Keep or wrap in shared surface | Preserve `href` and alert tone. |
| Low stock | local cards | Keep or wrap in shared surface | Preserve quantity and value display. |
| Recent sessions | `DataTable` | Keep `DataTable` | Preserve columns, route, action, formatting. |

## Stage 02 Components to Use

Required:

- `FilterBar`
- `StatCard`
- `DataTable`
- Feedback states where safe

Optional:

- `FormSection`: not expected for Dashboard.
- `Dialog`: not expected for Dashboard.
- `Drawer`: not expected for Dashboard.
- `ActionMenu`: not expected for Dashboard.

## Files Allowed for Stage 03 Implementation

Primary:

- `src/components/dashboard/dashboard-page-client.tsx`

Potential docs:

- `docs/ui-spec/stage-03-dashboard/07_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

## Files Read-Only During Stage 03

- `src/hooks/use-dashboard-summary.ts`
- `src/services/dashboard-service.ts`
- `src/repositories/dashboard-repository.ts`
- `src/types/domain.ts`
- `src/app/api/dashboard/summary/route.ts`

## Protected / Forbidden to Edit

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- runtime components
- `src/lib/badminton-store.ts`
- permission logic
- route hierarchy

