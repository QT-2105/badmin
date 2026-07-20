# Current Audit

Status: Complete

Adjustment uses `movementType: ADJUSTMENT`, `actualQuantityBall`, and repository-side difference calculation. UI must not calculate or change stock logic.

## Adjustment Semantics Baseline

| Question | Current behavior | Required preservation |
| --- | --- | --- |
| Form input mode | User enters final actual stock in balls/pieces. | Preserve absolute-stock input. |
| Delta input? | No. UI does not submit adjustment delta. | Do not convert to delta input. |
| Positive adjustment meaning | Repository computes `actualQuantityBall - oldQuantity`; positive result increases stock. | Preserve repository-side difference calculation. |
| Negative adjustment meaning | Repository computes `actualQuantityBall - oldQuantity`; negative result decreases stock. | Preserve repository-side difference calculation. |
| Zero adjustment | Repository returns without creating movement if difference is `0`. | Preserve repository behavior. |
| Payload quantity | UI sends `actualQuantityBall` only for `ADJUSTMENT`; it does not send `quantityTube`, `quantityBall`, or `salePricePerTube`. | Preserve payload mapping. |
| Current stock source | `outboundProduct.quantityBall` from existing product summary data. | Preserve data source. |
| Negative stock prevention | UI field has `min={0}` and repository asserts non-negative actual stock. | Preserve validation; do not add new stock rules. |

## Field Preservation Table

| Field | State key | Unit | Conversion | Validation | Payload mapping | Required preservation |
| --- | --- | --- | --- | --- | --- | --- |
| Loại xuất kho | `outboundType` | `ADJUSTMENT` literal | None | Existing option value | `movementType: outboundType` | Preserved. |
| Loại cầu | `outboundProductId` | Product ID | None | `ProductSelect required`; submit guard `if (!outboundProduct) return` | `productId: outboundProduct.id` | Preserved. |
| Tiêu đề | `outboundTitle` | Text | None | Trim required in `submitOutbound` | `title: outboundTitle` | Preserved. |
| Tồn thực tế theo quả | `actualQuantityBall` | Ball/piece | Repository computes difference | `min={0}` | `actualQuantityBall` only when `outboundType === 'ADJUSTMENT'` | Preserved. |
| Ghi chú | `outboundNote` | Text | None | Optional | `note: outboundNote` | Preserved. |

## Findings

- Current implementation already follows the required absolute-stock adjustment model.
- The UI can safely improve current-stock presentation, adjustment direction, helper text, and preview hierarchy.
- Any change to repository-side difference calculation, quantity sign convention, or payload shape is out of scope.
