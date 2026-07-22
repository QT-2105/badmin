# Visual System Audit

## Baseline

The current product visual system is based on:

- semantic CSS variables in `src/app/globals.css`
- Tailwind token usage
- shared primitives from Stage 02 and Stage 11
- operational dark runtime surfaces
- compact SaaS page layout outside Runtime

## Strengths

- App-wide `PageShell`, `PageHeader`, `SectionCard`, `PageSummaryGrid`, `StatCard`, `DataTable`, `FilterBar`, `Dialog`, `Drawer`, `ActionMenu` and form primitives are in place.
- Most non-runtime modules use semantic colors and shared surfaces.
- Runtime has a distinct operational dark treatment optimized for live tablet use.
- Motion has reduced-motion support in shared primitives.

## Risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Runtime visual language differs from app SaaS pages. | P1 | Intentional operational surface; should be visually QA'd, not normalized blindly. |
| Some direct utility color classes remain in Runtime and runtime child components. | P1 | Protected presentation; changes require careful screenshot/regression evidence. |
| Large presentation components may hide inconsistent spacing rules. | P1 | Address only if visual issue is confirmed. |
| Page-level screenshot evidence is missing. | P1 | Stage 12 should add manual/browser QA artifacts before RC acceptance. |

## Release Candidate Checks

- Verify first viewport composition for each root route.
- Verify surface hierarchy: page background, section surface, card/table surface, popover/dialog.
- Verify focused states are visible in light and dark.
- Verify danger/destructive actions are visually distinct but not dominant.
- Verify disabled states are readable and not confused with active actions.
