# Color Token Before/After Matrix

## Token Changes

| Token | Before | After | Reason |
| --- | --- | --- | --- |
| `--background` light | `214 40% 98%` | `214 38% 97%` | Slightly reduces all-white page feel while preserving neutral SaaS background. |
| `--surface` light | `0 0% 100%` | `210 35% 99%` | Keeps cards light but slightly warmer/token-aligned with page background. |
| `--surface-subtle` light | `210 33% 96%` | `210 30% 95%` | Improves separation for table headers, empty states and subtle panels. |
| `--surface-hover` light | `210 29% 94%` | `210 26% 93%` | Makes hover state visible without layout shift or stronger shadow. |
| `--overlay` light | `222 47% 11% / 0.48` | `222 47% 11% / 0.52` | Slightly improves dialog/drawer backdrop focus. |
| `--popover` light | `0 0% 100%` | `var(--surface-elevated)` | Aligns dropdown/dialog-like surfaces to elevated surface token. |
| `--border` light | `214 25% 88%` | `214 24% 86%` | Improves card/table/input separation. |
| `--border-strong` light | `214 20% 78%` | `214 18% 72%` | Creates clearer border hierarchy for elevated/hovered elements. |
| `--input` light | `214 25% 88%` | `214 24% 84%` | Inputs remain readable on cards and page surfaces. |
| `--input-hover` light | `214 20% 78%` | `214 18% 70%` | Makes hover/focus affordance clearer. |
| `--background` dark | `222 45% 6%` | `222 34% 8%` | Reduces black-block appearance while staying dark. |
| `--surface` dark | `222 35% 9%` | `222 28% 11%` | Gives cards stronger separation from background. |
| `--surface-subtle` dark | `220 28% 12%` | `222 24% 14%` | Improves subtle panel readability. |
| `--surface-elevated` dark | `220 27% 14%` | `222 22% 17%` | Makes elevated surfaces clearer without heavy shadows. |
| `--surface-hover` dark | `220 25% 17%` | `222 20% 20%` | Makes hover state visible on dense dark surfaces. |
| `--overlay` dark | `222 45% 4% / 0.72` | `222 34% 5% / 0.68` | Keeps overlay readable without becoming a black block. |
| `--text-primary` dark | `210 40% 96%` | `210 34% 94%` | Reduces overly bright white text. |
| `--text-secondary` dark | `214 32% 85%` | `214 24% 82%` | Keeps secondary text readable with softer contrast. |
| `--text-muted` dark | `215 20% 65%` | `215 18% 66%` | Maintains small-text readability. |
| `--text-disabled` dark | `215 15% 45%` | `215 14% 48%` | Disabled state remains identifiable without becoming invisible. |
| `--popover` dark | `222 47% 7%` | `var(--surface-elevated)` | Aligns dropdown/dialog-like surfaces to elevated surface token. |
| `--border` dark | `218 22% 18%` | `218 19% 22%` | Prevents low-contrast borders on dark cards. |
| `--border-strong` dark | `217 20% 27%` | `217 18% 32%` | Gives focused/hover/elevated states clearer hierarchy. |
| `--input` dark | `218 22% 18%` | `218 19% 25%` | Inputs no longer disappear into dark cards. |
| `--input-hover` dark | `217 20% 27%` | `217 18% 35%` | Improves input hover/focus affordance. |

## Shared Component Changes

| Component | Before | After | Reason |
| --- | --- | --- | --- |
| `StatusBadge` | soft semantic background with base tone text | soft semantic background with semantic foreground text | Higher contrast in light/dark while preserving text label. |
| `StatCard` | colored KPI value used base semantic tone | KPI value uses semantic foreground token | Improves long numeric value readability on soft backgrounds. |
| `FeedbackState` | semantic states used base tone text | semantic states use foreground token | Improves small text/icon contrast. |
| `NoticeCard` | semantic notices used base tone text | semantic notices use foreground token | Aligns inline feedback with feedback states. |
| `Surface` | elevated used default border | elevated uses strong border; interactive hover has stronger border | Clarifies hierarchy without stronger shadow. |
| shared form input classes | placeholder inherited browser default | placeholder uses muted token | Prevents placeholder/value ambiguity. |

## Unchanged by Design

- Runtime custom operational palette.
- Player tag color mapping.
- Chart data and chart semantics.
- KPI values and calculations.
- Status values and business meaning.

