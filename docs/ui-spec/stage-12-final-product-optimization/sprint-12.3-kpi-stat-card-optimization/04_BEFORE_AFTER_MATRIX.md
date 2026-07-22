# Before/After Matrix

| Area | Before | After | Reason |
| --- | --- | --- | --- |
| Shared `StatCard` background | tinted semantic backgrounds | neutral surface with semantic accent/ring/value | Avoids every KPI becoming a strong color block. |
| Shared `StatCard` elevation | default soft shadow | no default shadow | KPI cards are non-clickable and should not look like raised buttons. |
| Shared `StatCard` value size | 30px default | 24px base, 28px desktop | Keeps value below page-title hierarchy. |
| Shared `StatCard` label | foreground 13px | muted 12px | Keeps label scannable but quieter. |
| Dashboard revenue | `income` tone | `primary` tone | Main overview KPI is primary business metric, not automatic green status. |
| Dashboard inventory stable state | `inventory` tone | `success` tone | Stable stock is a positive status, not module color. |
| Dashboard inventory low-stock state | `warning` tone | unchanged | Low stock remains warning. |
| Inventory total products | `info` tone | `neutral` tone | Count is neutral, not status. |
| Inventory stock available | `inventory` tone | `success` tone | Positive stock state communicates availability. |
| Inventory zero stock | `neutral` tone | unchanged | Zero stock stays neutral because no low-stock threshold is present here. |

## Unchanged

- Dashboard KPI values.
- Finance totals/profit.
- Inventory stock and stock value.
- Schedule session stats.
- Runtime summary.
- Users and Settings admin summaries.
