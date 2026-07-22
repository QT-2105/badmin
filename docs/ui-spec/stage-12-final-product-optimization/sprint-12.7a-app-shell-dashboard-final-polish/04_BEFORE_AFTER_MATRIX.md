# Sprint 12.7A Before / After Matrix

| Area | Before | After | Reason |
| --- | --- | --- | --- |
| Sidebar surface | `bg-surface/95` and standard border. | `bg-surface-elevated/95` and softer border. | Clearer shell/page surface hierarchy. |
| Collapse button | Ghost button with quiet affordance. | Surface-muted button with ring. | Easier to identify as a control. |
| Active nav item | Primary tint with lighter border. | Primary soft surface and stronger token border. | Better active state visibility in light/dark mode. |
| Mobile header | Standard surface. | Elevated surface. | Consistent with app shell hierarchy. |
| Dashboard recent status | Plain muted text. | Neutral `StatusBadge`. | Clear label without relying on color only. |
| Dashboard mobile status | Plain rounded span. | Neutral `StatusBadge`. | Consistent recent-session presentation. |
| Dashboard chart bars | Colored bars with shadow. | Colored bars without shadow. | Reduces visual noise and keeps chart secondary to KPIs. |

## Unchanged

- Navigation groups and items.
- Permission filtering.
- Routes and redirects.
- Dashboard query, report period, KPI calculations and chart values.
