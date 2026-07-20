# Current Audit

Status: Complete

Movement detail currently appears in the history row title/note area. Data comes from `visibleMovements`.

## Data Baseline

| Area | Current behavior | Required preservation |
| --- | --- | --- |
| Source | `visibleMovements` derived from `sortedMovements` and pagination. | Preserve source. |
| Ordering | `sortedMovements` sorts by `createdAt` newest first. | Do not add or change sorting. |
| Pagination | Existing `movementPage`, `movementPageSize`, and `PaginationControls`. | Preserve pagination behavior. |
| Movement type | Rendered from `movement.movementType` through `MovementBadge`. | Preserve values and labels. |
| Product reference | Rendered from `movement.productName` and `ballsPerTube`. | Preserve data source. |
| Quantity | Rendered from `movement.quantityBall`. | Preserve sign and value. |
| Cost/price | Rendered from `costPerBall`, `usagePricePerBall`, `unitPrice`, and `totalAmount`. | Preserve values and formatting helper. |
| Timestamp | Rendered from `movement.createdAt`. | Preserve timestamp source. |
| Detail panel | No separate movement detail action/drawer currently exists. | Do not add a new workflow in this sprint. |

## Findings

- DataTable already provides horizontal overflow, loading state, empty state, and pagination.
- Long title/note readability can be improved inside row presentation.
- Cost, usage price, unit price, total amount, and timestamp can be made easier to scan without changing data.
- Date grouping is not currently present and is not added because that would introduce new data transformation.
