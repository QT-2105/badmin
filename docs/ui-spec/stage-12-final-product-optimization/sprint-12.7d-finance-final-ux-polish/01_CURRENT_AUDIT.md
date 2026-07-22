# Sprint 12.7D Current Audit

| Area | Current issue | Decision |
| --- | --- | --- |
| Expense KPI | `Chi phí` used danger tone, implying error/destructive state. | Change to neutral operational cost tone. |
| Transaction badge | Normal `Chi` used danger tone. | Change normal expense badge to neutral; reserve danger for errors/destructive/loss. |
| Profit | Profit tone already comes from caller by value. | Preserve `profitTone` behavior. |
| Currency | Values are readable but table/mobile amounts can benefit from tabular numbers. | Add presentation-only `tabular-nums`. |
| Table density | Current compact table remains appropriate. | No structural change. |
| Entry form | Existing grouping and helper text are RC-ready. | No field/payload change. |
| Filters | Current period controls are compact and stable. | No state/query change. |
| Empty state | Current no-data period message is specific. | Preserve. |
| Warning/destructive | No destructive action exists in Finance UI. | Do not add one. |

