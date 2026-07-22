# Sprint 12.7E Current Audit

| Area | Current issue | Decision |
| --- | --- | --- |
| Product summary | Stock KPI uses success/neutral only. | Use danger when total stock is zero, success otherwise. |
| Stock quantity | Tube/piece and ball counts are clear. | Preserve conversion and add status badge for scanability. |
| Low stock | Inventory source has no persisted low-stock threshold. | Use presentation-only "below one tube" warning from existing `ballsPerTube`. |
| Out of stock | Product rows do not explicitly label zero stock. | Add `Hết hàng` badge when `quantityBall <= 0`. |
| Average cost | Values are tabular in table; mobile values readable. | Preserve formatting. |
| Consumption movement | Quantity decrease used danger by sign, so all consumption looked danger. | Use warning for `PLAY_USAGE` quantity presentation. |
| Sale movement | Sale is an outbound operation, not necessarily an error. | Use info quantity tone. |
| Adjustment movement | Direction matters. | Use success/warning/neutral by adjustment quantity sign. |
| Forms/dialogs | Existing grouping, helper text and confirmation dialog are RC-ready. | No field, payload or handler change. |
| Table density | Current compact DataTable/mobile-card presentation is appropriate. | No structural change. |

