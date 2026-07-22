# Sprint 12.7A Current Audit

| Area | Finding | Decision |
| --- | --- | --- |
| App Shell sidebar | Sidebar works but blends closely with page surface. | Use elevated surface token and subtle border opacity. |
| App Shell active state | Active state is clear but can read more consistently with tokenized primary soft surface. | Strengthen active border/surface without changing route logic. |
| App Shell collapse affordance | Collapse button works but is visually too quiet. | Add subtle surface/ring affordance. |
| Mobile header | Works; can align better with sidebar surface hierarchy. | Use elevated surface token. |
| Dashboard KPI | Already handled in Sprint 12.3. | No KPI data change. |
| Dashboard chart | Chart bars had decorative shadow that can add noise. | Remove shadow from chart bars only. |
| Recent sessions status | Status was plain muted text. | Use text badge without changing status values. |
| Empty states | Existing states are present and clear. | No source change. |

## Protected Behavior

- App Shell route labels and targets remain unchanged.
- Permission filtering remains unchanged.
- Dashboard report period state and query remain unchanged.
- Dashboard KPI and chart calculations remain unchanged.
