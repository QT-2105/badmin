# Current Audit

Status: Complete

Sale uses `movementType: SALE`. Consumption is user-facing cầu hao and currently uses `movementType: PLAY_USAGE`. Do not rename this API/DB value.

## Field Preservation Table

| Branch | Field | State key | Unit | Conversion | Validation | Payload mapping | Required preservation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SALE | Loại cầu | `outboundProductId` | Product ID | None | `ProductSelect required`; submit guard `if (!outboundProduct) return` | `productId: outboundProduct.id` | Preserved. |
| SALE | Tiêu đề | `outboundTitle` | Text | None | Trim required in `submitOutbound` | `title: outboundTitle` | Preserved. |
| SALE | Số lượng ống | `outboundTubes` | Tube | Service/repository converts using product balls-per-tube | `min={1}` | `quantityTube: outboundTubes` | Preserved. |
| SALE | Đơn giá/ống | `salePricePerTube` | Money/tube | Existing movement creation uses outbound price | `min={0}`, `step={1}` | `salePricePerTube` | Preserved. |
| SALE | Ghi chú | `outboundNote` | Text | None | Optional | `note: outboundNote` | Preserved. |
| CONSUMPTION | Loại cầu | `outboundProductId` | Product ID | None | `ProductSelect required`; submit guard `if (!outboundProduct) return` | `productId: outboundProduct.id` | Preserved. |
| CONSUMPTION | Tiêu đề | `outboundTitle` | Text | None | Trim required in `submitOutbound` | `title: outboundTitle` | Preserved. |
| CONSUMPTION | Số cầu hao | `outboundBalls` | Ball/piece | No tube conversion in UI payload | `min={1}` | `quantityBall: outboundBalls` | Preserved. |
| CONSUMPTION | Movement type | `outboundType` | `PLAY_USAGE` | None | Existing option value | `movementType: outboundType` | Preserved. |
| Shared | Submit | `submitOutbound` | N/A | N/A | Existing error and required checks | `createMovement.mutateAsync(...)` | Preserved. |

## Findings

- Outbound form already shared one handler for SALE, PLAY_USAGE, ADJUSTMENT, and OTHER.
- Sprint 8.7 may improve only presentation for SALE and PLAY_USAGE without splitting logic.
- `PLAY_USAGE` is the current API/database value for user-facing consumption/chi cầu hao ca.
- Safe changes are labels, grouping, helper text, preview hierarchy, responsive grid, and button presentation.
