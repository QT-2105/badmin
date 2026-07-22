# Sprint 12.4 Before / After Matrix

| Area | Before | After | Reason |
| --- | --- | --- | --- |
| Shared `SectionCard` | One default padding density only. | Optional `density` prop with `compact`, `default`, `comfortable`; default unchanged. | Allows module-specific density without changing all screens. |
| Finance create section | Default section padding. | Compact section shell; form field and button heights unchanged. | Keeps manual voucher form scannable without extra whitespace. |
| Finance transaction list | Default section padding. | Compact section shell; table density already compact. | Prioritizes table comparison and period review. |
| Inventory toolbar | Compact filter with leftover `shadow-soft`. | Compact filter without decorative shadow. | Reduces visual noise above KPI and table content. |
| Inventory product section | Default section padding. | Compact section shell. | Product table and form are high-density operational content. |
| Inventory movement forms | Default section padding. | Compact section shell. | Keeps import/export controls closer to their active form. |
| Inventory movement history | Default section padding. | Compact section shell. | Supports faster scan of stock movements. |
| Settings navigation | Tall tiles, wider gaps and shadow. | Shorter tiles, tighter gap and no shadow. | Reduces sparse feel and gets users to settings content sooner. |
| Settings cards | Shadowed card surface. | Border/surface hierarchy only. | Settings cards are not elevated overlays. |

## Unchanged

- Dashboard overview spacing.
- Runtime workflow and protected files.
- Button/input touch target heights.
- DataTable density and behavior.
- Form field names, values and payloads.
