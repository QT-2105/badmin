# Current Audit

Status: Complete

Product list was a custom native table inside `SectionCard`. Columns and values must remain unchanged.

## Existing Product Columns

| Column | Source | Preservation |
| --- | --- | --- |
| Loại cầu | `product.name`, `product.brand`, `product.ballsPerTube`, `product.status` | Preserved. |
| Tồn ống - quả | `formatTubes(product.quantityBall, product.ballsPerTube)` | Preserved. |
| Tồn quả | `product.quantityBall` | Preserved. |
| Avg vốn/quả | `product.avgCostPerBall` with `formatCurrency` | Preserved. |
| Avg cầu hao/quả | `product.avgUsagePricePerBall` with `formatCurrency` | Preserved. |
| Giá trị tồn | `product.stockCostValue` with `formatCurrency` | Preserved. |
| Tiền bán | `product.totalSaleAmount` with `formatCurrency` | Preserved. |
| Thao tác | `editProduct(product)`, `removeProduct(product)` behind `canManageInventory` | Preserved. |

## Findings

- The previous custom table duplicated shared table presentation primitives.
- Product ordering already followed `products.map`; no sorting or pagination exists for products.
- Numeric columns were right-aligned but could be standardized with `DataTable`.
- Product status was text-only and easier to scan as a badge.
- Empty/loading states could be handled by shared table state presentation.
