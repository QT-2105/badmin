# Current Audit

Status: Complete

Import form uses `submitImport` and sends `movementType: IMPORT`, product ID, title, tube quantity, cost price per tube, usage price per tube, and note.

## Field Preservation Table

| Field | Data key | Unit | Conversion | Validation | Payload mapping | Required preservation |
| --- | --- | --- | --- | --- | --- | --- |
| Loại cầu | `importProductId` | Product ID | None | `ProductSelect required`; submit guard `if (!importProduct) return` | `productId: importProduct.id` | Preserved. |
| Tiêu đề | `importTitle` | Text | None | Trim required in `submitImport` | `title: importTitle` | Preserved. |
| Số lượng ống | `importTubes` | Tube | Preview uses `importTubes * importProduct.ballsPerTube`; repository receives `quantityTube` | `min={1}` | `quantityTube: importTubes` | Preserved. |
| Giá vốn nhập/ống | `costPricePerTube` | Money/tube | Preview divides by `ballsPerTube` | `min={0}`, `step={1}` | `costPricePerTube` | Preserved. |
| Giá đề xuất/ống | `usagePricePerTube` | Money/tube | Preview divides by `ballsPerTube` | `min={0}`, `step={1}` | `usagePricePerTube` | Preserved. |
| Ghi chú | `importNote` | Text | None | Optional | `note: importNote` | Preserved. |
| Movement type | Literal | `IMPORT` | None | N/A | `movementType: 'IMPORT'` | Preserved. |

## Findings

- The import form already had correct field and payload mapping.
- Previous layout placed all fields in a flat two-column grid with a compact preview.
- Safe changes are form grouping, helper text, preview hierarchy, responsive sizing, and button presentation.
- Import remains tube-based and uses `importProduct.ballsPerTube` for preview conversion.
