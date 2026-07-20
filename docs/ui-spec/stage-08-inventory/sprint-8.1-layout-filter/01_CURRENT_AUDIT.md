# Current Audit

Status: Complete

Current Inventory used `PageShell`, `PageHeader`, and `ToolbarCard`. Report period state and handlers live in `InventoryPageClient` and must be preserved.

## Control Preservation Table

| Control | Current value source | Current handler | Current query effect | Required preservation |
| --- | --- | --- | --- | --- |
| Report period | `reportPeriod`, default `MONTH` | `setReportPeriod(event.target.value as ReportPeriod)` | Client-side `reportTotals` period filtering only | Preserve state, values `MONTH`/`YEAR`, default, and handler. |
| Report month | `reportMonth`, default current month in `YYYY-MM` | `setReportMonth(event.target.value)` | Client-side `isInReportPeriod` for `reportTotals` | Preserve input type, value, and handler. |
| Report year | `reportYear`, default current year | `setReportYear(event.target.value)` | Client-side `isInReportPeriod` for `reportTotals` | Preserve input type, min/max, value, and handler. |
| Search | Not present in Inventory source | Not present | No effect | Do not add search in Sprint 8.1. |

## Findings

- `ToolbarCard` created a visually heavier filter area than Stage 07 Finance.
- The report-period controls already have isolated local state and no API/query-key side effect.
- No search state, search handler, search debounce, URL query behavior, or filter query parameters exist in current Inventory source.
- Safe migration target is `FilterBar`, provided that all values and handlers remain unchanged.
