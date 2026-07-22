# KPI and Statistic Card Inventory

| Module | KPI/stat | Component | Classification | Decision |
| --- | --- | --- | --- | --- |
| Dashboard | Doanh thu | `StatCard` | Primary business metric | Use primary tone because it is the main overview metric, not merely a green status. |
| Dashboard | Chi phí | `StatCard` | Negative metric | Keep danger/expense tone. |
| Dashboard | Lợi nhuận | `StatCard` | Positive metric / Negative metric / Neutral metric by value | Keep caller value-based tone. |
| Dashboard | Tồn kho cầu | `StatCard` | Warning metric if low stock, Positive metric if stable | Use warning if low stock, success otherwise. |
| Finance | Doanh thu | `StatCard` | Positive metric | Keep success tone because this page is explicitly about financial inflow/outflow. |
| Finance | Chi phí | `StatCard` | Negative metric | Keep danger tone. |
| Finance | Lợi nhuận | `StatCard` | Positive metric / Negative metric / Neutral metric by value | Keep existing `profitTone`. |
| Inventory | Tổng loại cầu | `StatCard` | Neutral metric | Use neutral tone. |
| Inventory | Tồn kho | `StatCard` | Positive metric / Neutral metric | Use success when stock exists, neutral when zero. |
| Inventory | Giá trị tồn vốn | `StatCard` | Informational metric | Keep info tone. |
| Inventory | Chi cầu hao ca | `StatCard` | Negative metric | Keep expense tone. |
| Inventory | Tiền bán cầu | `StatCard` | Positive metric | Keep income tone. |
| Inventory | Tổng tiền cầu | `StatCard` | Neutral metric | Keep neutral tone. |
| Schedule Session Detail | Thời gian | `StatCard` | Informational metric | Keep info tone. |
| Schedule Session Detail | Người chơi | `StatCard` | Neutral metric | Keep neutral tone. |
| Schedule Session Detail | Thu dự kiến | `StatCard` | Positive metric | Keep income tone. |
| Runtime | Total/waiting/playing summary | custom `StatPill` | Neutral metric / Informational metric / Warning metric depending status | Audit only; no Runtime file changed. |
| Users | Role user/permission counts | custom role cards | Neutral metric | Audit only; no change required. |
| Settings | Section/status surfaces | custom surfaces | Informational metric / Warning metric for destructive areas | Audit only; no change required. |

## Findings

- The re-evaluation added exact classification labels from the Sprint brief.
- Dashboard revenue now uses primary tone instead of income/success because it is the main overview metric, not a status.
- The primary adjustment was to remove module-color dependency for inventory-oriented cards.
- Full tinted card backgrounds were already reduced in Sprint 12.2 via shared `StatCard`.
- Non-clickable shared `StatCard` no longer carries default shadow; semantic emphasis is via accent/ring/value.
- Runtime `StatPill` remains protected and unchanged.
