# Color System Audit

## Static Scan Summary

The color scan looked for:

- hex/rgb/hsl literals
- hard-coded Tailwind hue utilities
- runtime dark palette classes
- shadow arbitrary values

## Findings

| Area | Status | Notes |
| --- | --- | --- |
| `src/app/globals.css` | Expected | Defines semantic tokens and shadow values. |
| Non-runtime pages | Mostly tokenized | Dashboard, Finance, Inventory, Users and Settings generally rely on shared primitives and semantic tones. |
| Runtime shell and cards | Custom operational palette | Uses slate/cyan/emerald/amber/rose and white alpha classes heavily; protected and intentional. |
| `src/lib/player-tags.ts` | Custom tag palette | Tag colors are domain presentation. Must preserve tag semantics. |
| Dialog/Drawer/shared UI | Tokenized | Uses semantic surface/overlay/tone tokens. |

## P1 Color Risks

- Runtime palette should be contrast-tested on real tablet and in dark mode.
- Cyan/emerald/amber runtime controls should be checked for visual overload during a live session.
- Player tag colors should include text labels and not rely only on color.

## P2 Color Polish

- Consider final minor alignment of Runtime focus ring and badge tone with shared token naming only if screenshots show inconsistency.
- Avoid converting Runtime wholesale to global tokens in Stage 12 unless visual QA proves a specific problem.

## Out of Scope

- Changing runtime meaning of colors.
- Changing finance/inventory semantic tone mappings.
- Changing role/permission/status semantics.
