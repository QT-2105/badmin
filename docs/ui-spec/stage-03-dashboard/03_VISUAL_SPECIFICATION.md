# Visual Specification

## Visual Direction

Dashboard should feel:

- calm
- operational
- premium SaaS
- information-dense but not crowded
- easy to scan on desktop and tablet

## Layout Principles

- Use one clear vertical flow.
- Prefer grouped operational bands over disconnected cards.
- Keep Dashboard page-level spacing consistent with Stage 01 foundation.
- Use Stage 02 shared primitives for repeatable structures.
- Keep horizontal overflow for wide recent-session data.

## Typography

Page title:

- use existing `PageHeader` hierarchy.
- no oversized marketing hero treatment.

Section titles:

- use Stage 01 section title hierarchy.
- avoid overly small labels for operational sections.

Metric labels:

- uppercase or compact label acceptable if contrast is clear.
- value must be visually stronger than label and subtext.

## Color

Use semantic tones only:

- revenue: success/income
- expense: danger/expense
- profit: info/profit when positive, danger when negative
- inventory: inventory
- warning/attention: warning
- error: danger

Avoid:

- arbitrary raw colors
- low-contrast tone-on-tone combinations
- changing metric meaning by color

## Cards and Surfaces

KPI cards:

- use `StatCard`
- keep equal height
- align labels and values consistently

Filter/report control:

- use `FilterBar`
- compact height
- controls right-aligned on desktop
- stacked safely on mobile

Info cards:

- can continue using `SectionCard` or migrate to shared surface if no behavior changes.
- empty states should use Stage 02 feedback states.

Recent sessions:

- use `DataTable`
- keep horizontal overflow
- preserve columns and action button

## Loading, Empty, Error

Stage 03 should replace generic notices where safe:

- loading: `LoadingState`
- error: `ErrorState`
- empty sections: `EmptyState`

Do not hide operational warnings.

## Responsive Requirements

Check:

- desktop 1440px
- laptop 1280px
- tablet landscape
- tablet portrait
- mobile smoke

Expected behavior:

- KPI cards wrap cleanly.
- report controls remain usable.
- recent sessions remain horizontally scrollable.
- no text overlaps.
- no card content clips important values.

