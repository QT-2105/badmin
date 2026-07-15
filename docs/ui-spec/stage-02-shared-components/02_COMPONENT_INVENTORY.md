# Component Inventory

## Existing Foundation Components

These already exist after Stage 01 and Stage 01.5.

| Component/File | Current Purpose | Stage 02 Status |
|---|---|---|
| `src/components/ui/button.tsx` | Shared button variants and sizes | Keep; may add icon-only ergonomics only if non-breaking |
| `src/components/ui/form.tsx` | `Input`, `Select`, `Textarea`, `Checkbox`, `Switch` | Keep; use inside new shared forms |
| `src/components/ui/status-badge.tsx` | Semantic status badge tones | Keep; extend only if needed |
| `src/components/ui/feedback.tsx` | `Skeleton`, `Separator`, `EmptyState` | Extend into full feedback state system |
| `src/components/ui/surface.tsx` | `Surface`, `Card`, `SectionSurface` | Use as base for table/form/dialog surfaces |
| `src/components/ui/page-layout.tsx` | `PageShell`, `PageHeader`, `SectionHeader`, cards, notices | Keep; `StatCard` may wrap or replace `MetricCard` only after compatibility review |
| `src/components/ui/pagination-controls.tsx` | Shared pagination controls | Reuse in `DataTable` |

## Current Local Patterns To Consolidate

| Area | Current Pattern | Target Component |
|---|---|---|
| Finance transaction list | Custom list rows, custom header/filter actions | `DataTable`, `FilterBar`, `StatusBadge` |
| Inventory product and movement lists | Custom tables/lists with horizontal scroll | `DataTable`, `FilterBar`, `StatusBadge` |
| Users list | Custom grid table with editable fields | `DataTable` with custom cell renderers |
| Dashboard recent sessions table | Custom table | `DataTable` readonly variant |
| Schedule cards | Local card/action structure | `Surface`, `ActionMenu` later if needed |
| Settings collapsible sections | Local settings cards | `FormSection` |
| Confirmation modal | Local modal markup | `Dialog` |
| Mobile secondary workflows | No shared drawer primitive | `Drawer` |
| Empty/loading/error text | Mixed `NoticeCard`, local blocks, `EmptyState` | unified feedback states |

## Components Not To Consolidate In Stage 02

| Area | Reason |
|---|---|
| Runtime court cards | Protected runtime workflow and touch orchestration |
| Next match cards | Protected matchmaking interaction semantics |
| Runtime queue/player panel | Protected scheduling behavior |
| Shuttlecock movement service logic | Business/inventory logic, not UI library |
| Finance totals calculation | Business calculation, not UI library |

## Inventory Gaps

Stage 02 should fill these gaps:

- no shared `DataTable`
- no shared `FilterBar`
- no shared `ActionMenu`
- no shared `Dialog`
- no shared `Drawer`
- no shared `FormSection`
- no shared all-purpose `StatCard`
- no standard row density contract
- no standard table empty/loading/error contract
- no standard column alignment contract

