# Current Audit

Status: Complete

Metrics come from `products`, `totals`, `reportTotals`, and existing formatting helpers in `InventoryPageClient`.

## Existing KPI Sources

| KPI | Source | Formula owner | Preservation |
| --- | --- | --- | --- |
| Tổng loại cầu | `products.length` | Existing Inventory page data | Preserved. |
| Tồn kho | `totals.tubes`, `totals.looseBalls`, `totals.balls` | Existing `totals` memo | Preserved. |
| Giá trị tồn vốn | `totals.stockCost` | Existing `totals` memo | Preserved. |
| Chi cầu hao ca | `reportTotals.usage`, usage tube/ball fields | Existing `reportTotals` memo | Preserved. |
| Tiền bán cầu | `reportTotals.sales`, sale tube/ball fields | Existing `reportTotals` memo | Preserved. |
| Tổng tiền cầu | `reportTotals.totalOutboundAmount`, total outbound tube/ball fields | Existing `reportTotals` memo | Preserved. |

## Findings

- Existing `MetricCard` presentation worked but differed from Stage 02 `StatCard` hierarchy used by newer pages.
- KPI values were already computed in the page; no new KPI or calculation was needed.
- Loading state showed a separate notice while KPI cards could still render zero-like values from default arrays.
- Safe change is to migrate only the card primitive and loading presentation while keeping all value expressions intact.
