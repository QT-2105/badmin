# Before/After Matrix

## Typography

| Item | Before | After | Reason |
| --- | --- | --- | --- |
| KPI default value | `text-[30px]` | `text-2xl md:text-[28px]` | Keeps KPI prominent but below page title. |
| KPI compact value | `text-2xl` | `text-xl md:text-2xl` | Better dense-card fit and avoids crowding. |
| KPI label | `text-[13px] text-foreground` | `text-[12px] text-muted-foreground` | Label remains scannable without competing with value. |

## Border and Surface

| Item | Before | After | Reason |
| --- | --- | --- | --- |
| `Surface` default | border + surface + `shadow-soft` | border + surface | Level 1 card should not rely on shadow. |
| `Surface` interactive | border + surface + shadow-soft | border + surface + shadow-xs, hover shadow-sm | Interactive affordance without button-like elevation. |
| `ToolbarCard` | border + surface + shadow-soft | border + surface | Reduces visual noise. |
| `SectionCard` | border + surface + shadow-soft | border + surface | Reduces nested card border/shadow heaviness. |
| `DataTable` container | border + surface + shadow-soft | border + surface | Tables remain contained without heavy card feel. |
| DataTable rows | `border-border` | `border-border/80` | Softer dense table dividers. |
| Mobile DataTable card | subtle surface + border + shadow | subtle surface + border | Avoids stacked shadows in mobile lists. |

## Elevation

| Level | Element | Implementation |
| --- | --- | --- |
| 0 | Page and inline content | no shadow |
| 1 | Normal cards/surfaces/tables | border + surface |
| 2 | Interactive surface/dropdown | `shadow-xs` or `shadow-sm` |
| 3 | Dialog/drawer | existing `shadow-md` |

## Radius

No radius token or component radius change was required. The existing system remains:

- controls: rounded-lg
- cards/tables/dialogs: rounded-xl
- badges: rounded-full
- drawers: placement-specific rounded edge

