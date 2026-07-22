# Sprint 12.4 Current Audit

## Findings

| Area | Finding | Priority |
| --- | --- | --- |
| Shared `SectionCard` | Existing card padding works for overview pages but is a little roomy for dense finance/inventory operational sections. | P1 |
| Finance create/list sections | Summary is compact, but the create section and transaction section can use denser shell padding without changing form field sizes. | P1 |
| Inventory toolbar | Filter bar still carries a decorative `shadow-soft`, making the top control visually heavier than needed. | P2 |
| Inventory product/movement sections | Product, stock operation and movement sections are operationally dense and benefit from compact section padding. | P1 |
| Settings navigation | Navigation tiles are tall for the amount of content and consume too much vertical space before settings content. | P1 |
| Settings cards | Settings cards still use `shadow-soft`, making non-elevated surfaces feel heavier and more spaced out. | P2 |
| Dashboard | Current spacing supports overview scanning; no change needed. | P2 |
| Runtime | Current compactness is protected and appropriate for tablet operations; no change. | P0 protected |

## Responsive Baseline

The changes target shared density and section-level spacing only. Touch targets remain at or above the existing button/input heights:

- Buttons: existing `h-10`, `h-11`, `h-12` retained.
- Inputs/selects: existing `h-10` retained.
- Settings navigation: minimum height reduced but remains above 64px.

## Risk

The main risk is over-compacting operational pages. This sprint does not reduce field height or button height, only surrounding surface/navigation spacing.
