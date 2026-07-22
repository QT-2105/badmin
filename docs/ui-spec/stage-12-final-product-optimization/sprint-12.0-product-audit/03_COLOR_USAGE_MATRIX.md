# Color Usage Matrix

## Source Scan Summary

Static scan targets:

- hard-coded hex/rgb/hsl
- arbitrary Tailwind colors
- direct slate/cyan/emerald/amber/rose color families
- custom shadows
- tokenized semantic colors

## Matrix

| Area | Token usage | Direct color usage | Risk | Notes |
| --- | --- | --- | --- | --- |
| Global theme | High | Expected CSS variables | Low | `globals.css` defines semantic tokens and shadows. |
| Shared UI | High | Low | Low | `Button`, `Surface`, `StatusBadge`, `StatCard`, feedback states mostly use semantic tokens. |
| Dashboard | High | Medium | Low | Uses semantic tones; local chart color map should be visually checked. |
| Schedule | High | Low | Low | Mostly shared tokenized surfaces and badges. |
| Session Workspace | High | Medium | Medium | Dense financial/status surfaces use semantic tokens with some custom emphasis. |
| Runtime | Medium | High | Medium | Direct slate/cyan/emerald/amber palette is intentionally operational but should be contrast-reviewed. |
| Finance | High | Low | Low | Semantic income/expense/profit tones are clear. |
| Inventory | High | Low | Low | Semantic inventory/success/warning/danger tones are used. |
| Users | High | Low | Low | Role/status colors include text labels. |
| Settings | High | Low | Low | Danger sections are semantically clear. |

## Findings

- No confirmed color P0.
- Runtime is the main direct-color exception and should not be normalized without a specific contrast problem.
- `src/lib/player-tags.ts` and runtime player labels use custom domain colors; these are presentation-domain mappings and must not change status semantics.
- KPI tones are generally correct, but final visual QA should verify that no page has too many accents competing equally.

## Candidate RC Checks

- profit positive/negative/zero contrast
- warning vs danger distinction in light/dark
- runtime cyan-on-dark contrast
- disabled action contrast
- low-stock warning contrast
- permission matrix selected/disabled contrast

