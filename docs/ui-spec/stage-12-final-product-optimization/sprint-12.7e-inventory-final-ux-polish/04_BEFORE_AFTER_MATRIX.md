# Sprint 12.7E Before / After Matrix

| Area | Before | After |
| --- | --- | --- |
| Total stock KPI | Success when stock exists, neutral when zero. | Success when stock exists, danger when total stock is zero. |
| Consumption KPI | Used `expense` tone. | Uses warning tone to indicate operational consumption, not error. |
| Product stock status | Status only showed active/inactive. | Adds stock status badge: `Còn hàng`, `Sắp hết`, `Hết hàng`. |
| Low-stock display | Not explicit on Inventory list. | `quantityBall < ballsPerTube` gets `Sắp hết` warning presentation. |
| Out-of-stock display | Zero stock only shown as number. | Zero stock gets `Hết hàng` danger presentation. |
| Movement quantity | Negative quantities used danger by sign. | Tone is movement-type aware: import success, sale info, consumption warning, adjustment by direction. |
| Product form helper | Mentioned hard-coded default `12`. | Uses neutral default wording without hard-coding value in helper copy. |
| Forms/dialogs | Existing presentation. | Unchanged. |

