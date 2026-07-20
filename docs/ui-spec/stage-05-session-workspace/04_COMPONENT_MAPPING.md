# Component Mapping

Status: Ready for implementation planning

Source code changed: No

## Target Source

- `src/components/schedule/session-detail-client.tsx`

## Mapping Principle

Do not create a new component if an existing shared component is sufficient.

Shared components must remain presentation-first and must not receive business logic, data fetching, mutation logic, permission checks, finance calculations, inventory calculations, or runtime state.

## Shared Component Priority

Preferred shared primitives for Stage 05:

1. `PageShell` / PageLayout
2. `PageHeader`
3. `StatCard`
4. Summary card pattern using `StatCard` or `Surface`
5. `Surface`
6. `StatusBadge`
7. `DataTable`
8. `FormSection`
9. `FilterBar`
10. `ActionMenu`
11. `Dialog`
12. `Drawer`
13. `EmptyState`
14. `LoadingState`
15. `Skeleton`

Priority does not mean every component must be used. It means existing shared primitives should be considered before adding local markup or a new component.

## Existing UI Areas to Map

| Area | Current Role | Preferred Shared Primitive | Notes |
| --- | --- | --- | --- |
| Page wrapper | page spacing | `PageShell` | Preserve route and data behavior. This is the PageLayout primitive in current source. |
| Header | title/navigation/actions | `PageHeader` | Keep existing action gating. |
| Session summary cards | time/player/revenue | `StatCard` | Use only if values and layout stay identical. |
| Player summary card | player working area | `Surface` or `FormSection` | Keep add-player form and player rows in same operational area. |
| Finance summary card | cash/bank/unpaid totals | `Surface`, compact `StatusBadge`, or inline summary | Keep near player list; do not create a large dashboard-style block. |
| Court summary card | court cost and court context | `FormSection` + `Input` | Preserve fields and update handler. |
| Shuttle summary card | product, usage, saved label | `FormSection` + `Select` + `Input` | Preserve product id/name fallback and usage calculation. |
| Completion info | grouped form | `FormSection` + `Surface` | Preserve fields and update handler. |
| Inputs | court cost, shuttlecock count, notes | `Input`, `Select`, `Textarea` | Do not change state or validation. |
| Player add form | inline creation | `FormSection`, `Input`, `Select`, `Button` | Preserve payload and avatar upload behavior. |
| Player rows | session player list | `Surface` row cards; `DataTable` only if touch UX is preserved | DataTable is lower priority here because current row cards support quick view and touch operation. |
| Status display | session/payment status | `StatusBadge` | Keep domain labels. |
| Empty/loading/error | feedback states | `LoadingState`, `ErrorState`, `EmptyState`, `WarningState` | Preserve existing conditions. |
| Secondary actions | edit/delete | `ActionMenu` optional | Do not hide primary operational actions. |
| Confirm UI | complete confirmation | existing modal or `Dialog` only with explicit approval | Dialog can standardize UI but must not change confirmation behavior. |
| Mobile secondary workflow | not currently needed | `Drawer` deferred | Do not introduce drawer unless a specific mobile workflow needs it. |
| Filters | no filter bar on current screen | `FilterBar` not planned | Do not add filters in Stage 05. |

## Component Usage Decisions

| Component | Stage 05 Decision | Reason |
| --- | --- | --- |
| `PageShell` | Use | Standardizes page spacing and responsive shell without business impact. |
| `PageHeader` | Use | Standardizes title/back/action layout while preserving existing actions. |
| `StatCard` | Use for session summary if values stay identical | Replaces local `InfoCard` without new business logic. |
| Summary card pattern | Use via `StatCard`/`Surface`, no new component | Shared primitives are sufficient. |
| `Surface` | Use | Replaces repeated `rounded-xl border bg-surface` blocks. |
| `StatusBadge` | Already used; continue | Payment/status labels already map to existing domain values. |
| `DataTable` | Avoid for initial player list migration | Player rows are touch-oriented and have quick view/edit interactions; DataTable may reduce usability. |
| `FormSection` | Use | Fits completion and player form grouping. |
| `FilterBar` | Not used | Session Workspace has no filtering requirement; adding it would be a new feature. |
| `ActionMenu` | Conditional | Use only if secondary actions become visually crowded; do not hide primary actions. |
| `Dialog` | Defer unless approved | Current complete confirmation flow is business-adjacent; replacing it needs explicit acceptance. |
| `Drawer` | Not used | No secondary mobile workflow in current scope. |
| `EmptyState` | Already used; continue | Good fit for no-player state. |
| `LoadingState` | Use where safe | Can replace `NoticeCard` loading without logic change. |
| `Skeleton` | Conditional | Use compact skeletons only if they match final density and do not add layout churn. |

## Do Not Create New Components

Do not create:

- new `SessionSummaryCard`
- new `PlayerSummaryCard`
- new `FinanceSummaryCard`
- new `CourtSummaryCard`
- new `ShuttleSummaryCard`
- new upload primitive
- new table/list abstraction
- new modal/drawer abstraction

Use `StatCard`, `Surface`, `FormSection`, `StatusBadge`, and feedback primitives first.

## Components Not Planned for Initial Migration

- `Drawer`
- broad `Dialog` migration
- `FilterBar`
- `DataTable` for initial player row migration
- new table abstraction for players
- new upload component unless existing behavior is preserved exactly

## Mapping Rules

- Presentation-only migration is allowed.
- Component props that carry business state must not be renamed.
- Handler signatures must not change.
- Payload creation must not change.
- Shared components must not receive business logic.
- Runtime-related components must remain untouched.
- No new component may be introduced until this mapping proves shared primitives are insufficient.
- If a shared component cannot support required density or interaction without prop changes that affect other screens, stop and ask before creating a new component.

## Adoption Risks

| Component | Risk | Decision |
| --- | --- | --- |
| `DataTable` for player list | Could reduce touch ergonomics and change row layout semantics. | Avoid unless explicitly planned. |
| `Dialog` for completion/delete | Could change confirmation workflow. | Avoid in Stage 05 unless separately approved. |
| `ActionMenu` for player actions | Could reduce discoverability. | Use only for secondary actions if clear. |
| `StatCard` for summary | Low risk if data values unchanged. | Allowed. |
| `FormSection` | Low risk if fields/handlers unchanged. | Preferred. |
| `FilterBar` | Would imply filter feature on a screen that currently has none. | Do not use. |
| `Drawer` | Could introduce a new mobile workflow. | Do not use. |
| `Skeleton` | Could add visual churn if oversized. | Use only compact placeholders. |
