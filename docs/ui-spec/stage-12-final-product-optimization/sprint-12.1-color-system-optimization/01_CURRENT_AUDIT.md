# Current Color Audit

## Baseline

The project already has a semantic token system in `src/app/globals.css`.

Shared UI primitives mostly consume:

- `background`
- `surface`
- `surface-subtle`
- `surface-elevated`
- `surface-hover`
- `foreground`
- `muted-foreground`
- `border`
- `borderStrong`
- `primary`
- `success`
- `warning`
- `danger`
- `info`
- `inventory`

## Confirmed Issues

| Issue | Evidence | Priority |
| --- | --- | --- |
| Light surfaces are close to pure white and page background is very pale. | `--surface`, `--surface-elevated` and `--popover` are `0 0% 100%`; background is `214 40% 98%`. | P1 |
| Dark mode background and surface can feel like dense black blocks. | `--background` is `222 45% 6%`; popover is `222 47% 7%`. | P1 |
| Elevated surfaces have the same light token as regular surfaces. | `--surface-elevated` equals white in light mode. | P2 |
| Semantic soft components use base tone text in several shared primitives. | `StatusBadge`, `FeedbackState`, `StatCard` use `text-success`, `text-warning`, etc. on soft backgrounds. | P1 |
| Borders use a single default token in many shared surfaces. | `Surface` variants all use `border-border`. | P2 |

## Intentional Exceptions

- Runtime uses a custom operational dark palette. It remains unchanged in this sprint because Runtime behavior and operator ergonomics are protected.
- Player tag color mapping remains unchanged because it is domain presentation mapping.
- Chart local tone mapping remains unchanged because chart semantics and data are stable.

