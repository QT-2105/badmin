# Current Audit

Status: Complete

Inventory contains wide product and movement tables with internal scroll. Responsive work must preserve every critical action.

## Responsive Baseline

| Area | Current behavior | Required preservation |
| --- | --- | --- |
| KPI summary | Grid uses responsive columns and existing StatCard data. | Preserve all KPI values and source. |
| Report filter | FilterBar holds report period and date controls. | Preserve filter state, defaults, and handlers. |
| Product table | DataTable has internal horizontal scroll and product actions. | Preserve rows, actions, and values. |
| Movement table | DataTable has internal horizontal scroll and pagination. | Preserve rows, ordering, pagination, and values. |
| Product form | Inline form appears only when current state opens it. | Preserve fields and submit behavior. |
| Import form | Inline form appears under stock form tabs. | Preserve fields and submit behavior. |
| Outbound form | Inline form handles SALE, PLAY_USAGE, ADJUSTMENT, and OTHER. | Preserve fields, payloads, and submit behavior. |

## Viewport Risks

- Tablet landscape benefits from three KPI columns instead of waiting for wide desktop.
- Tablet portrait needs form fields in two columns where space allows.
- Mobile should avoid button text wrapping and should keep submit buttons easy to tap.
- Wide tables should keep internal scroll instead of causing page-level horizontal overflow.
