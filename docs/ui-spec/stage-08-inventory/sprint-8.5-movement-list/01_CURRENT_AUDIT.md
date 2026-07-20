# Current Audit

Status: Complete

Movement list uses `sortedMovements`, `visibleMovements`, `movementPage`, and `movementPageSize`. Order and pagination are protected.

## Existing Movement Columns

| Column | Source | Preservation |
| --- | --- | --- |
| Loại | `movement.movementType` through `MovementBadge` | Preserved. |
| Nội dung | `movement.title || movement.productName` | Preserved. |
| Product / note | `movement.productName`, `movement.note || '-'` | Preserved. |
| SL quả | `movement.quantityBall` with existing positive sign behavior | Preserved. |
| Vốn/quả | `movement.costPerBall` with `formatCurrency` | Preserved. |
| Giá hao/quả | `movement.usagePricePerBall` with `formatCurrency` | Preserved. |
| Tổng tiền | `movement.totalAmount` with `formatCurrency` | Preserved. |
| Created time | `formatCreatedAt(movement.createdAt)` | Preserved. |

## Findings

- Movement history used a custom grid/list instead of the shared table primitive.
- Ordering already comes from `sortedMovements`; page rendering uses `visibleMovements`.
- Pagination is already handled by `PaginationControls`.
- Safe change is presentation-only migration to `DataTable` using `visibleMovements` as rows and the existing pagination slot.
- Source movement value for consumption is `PLAY_USAGE`; user-facing label remains `Chi cầu hao ca`.
