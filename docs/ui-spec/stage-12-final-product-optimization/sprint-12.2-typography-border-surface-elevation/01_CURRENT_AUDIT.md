# Current Audit

## Typography

| Element | Baseline | Finding |
| --- | --- | --- |
| Page title | `text-page-title` at 30/32px | Good; should remain strongest text on page. |
| Page description | 14px/line-height 6 | Good; readable and not too dominant. |
| Section title | `text-section-title` | Good; slightly smaller than page title. |
| Card title | `text-card-title` | Good. |
| KPI value | `StatCard` 30px default before Sprint 12.2 | Too close to page title. |
| KPI label | 13px semibold uppercase | Slightly strong across dense groups. |
| Table header | `DataTable` semibold muted | Good. |
| Table body | 14px default | Good. |
| Form label | `text-text-secondary` | Good. |
| Helper text | muted text-xs/sm | Good. |
| Error text | danger text-xs | Good. |
| Badge | shared `StatusBadge` | Good; text label preserved. |
| Button | shared `Button` | Good. |
| Caption | DataTable caption is screen-reader only where needed | Good. |

## Border and Surface

Findings:

- Card/surface separation improved in Sprint 12.1.
- Too many normal cards still used `shadow-soft`.
- DataTable and mobile cards used card-level shadow even though border/surface is enough.
- FormSection inherits `Surface`; reducing default surface shadow improves nested form/card readability.

## Elevation

Target levels:

- Level 0: page and inline content, no shadow.
- Level 1: normal card/surface, border + surface only.
- Level 2: dropdown/popover/interactive surface, small shadow.
- Level 3: dialog/drawer/command menu, `shadow-md`.

## Radius

Current radius system is acceptable:

- small control/button/input: rounded-lg
- card/table/dialog: rounded-xl
- badge: rounded-full by default
- drawer: placement-specific rounded edge

No new radius token was needed.

