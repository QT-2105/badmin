# Current UI Audit

Status: Audit complete, no source code changed

Audited source:

- `src/components/dashboard/dashboard-page-client.tsx`
- Stage 01 foundation docs
- Stage 01.5 visual consistency docs
- Stage 02 shared component docs
- Stage 03 Dashboard planning docs

## Audit Guardrails

Stage 03 Dashboard work must preserve:

- `useDashboardSummary({ period, month, year })`
- `DashboardSummary` data shape
- dashboard API, repository, service, and query behavior
- all finance, inventory, session, and profit calculations
- route targets and action links
- recent session table columns
- status labels and formatting semantics

No business logic, API, database, Prisma, repository, service, runtime, route, or permission changes are allowed.

## Current Dashboard Structure

The current Dashboard renders:

1. `PageShell`
2. `PageHeader`
3. report period toolbar
4. loading and error notices
5. four KPI cards
6. daily cashflow chart
7. cost breakdown, alert, and low-stock cards
8. recent sessions table using Stage 02 `DataTable`

## Executive Summary

The Dashboard is functionally aligned with the product direction and already uses several shared primitives. The biggest remaining issue is not data correctness, but visual and component consistency. The page still mixes Stage 01 layout primitives with Stage 02 shared components, and several local Dashboard-only patterns remain.

No P0 blocker was found from source audit. The main Stage 03 work should focus on P1 consistency: replacing Dashboard-specific visual wrappers with approved shared components where safe, tightening responsive behavior, and improving accessibility of the chart and feedback states.

## Priority Findings

### P0

No P0 issue was found in code-level audit.

Notes:

- No direct business calculation mutation is present in the Dashboard component.
- No API, repository, service, Prisma, runtime, or permission dependency should be changed for Stage 03.
- No severe theme token violation was identified from source alone.

Visual QA is still required after implementation for actual contrast in light and dark mode.

### P1

| Area | Finding | Required Direction |
| --- | --- | --- |
| Report period | Uses `ToolbarCard` plus manual controls instead of Stage 02 `FilterBar`. | Migrate to `FilterBar` while preserving `period`, `month`, `year`, and handlers. |
| KPI cards | Uses `MetricCard`, not Stage 02 `StatCard`. | Migrate to `StatCard`; keep exact values, tones, icons, and formatting. |
| Loading/error | Uses `NoticeCard`; Stage 02 feedback states are available. | Use shared loading/error primitives if the visible behavior can remain equivalent. |
| Cashflow chart | Local bar chart uses hard-coded visual sizing and has limited accessible summary. | Keep data logic, but add safer semantic structure and clearer responsive presentation. |
| Responsive behavior | `PageShell minWidth="min-w-[720px] md:min-w-0"` can force horizontal page behavior on small screens. | Recheck mobile and tablet behavior; keep horizontal overflow only where data genuinely needs it. |
| Shared components | Dashboard mixes `PageHeader`, `SectionCard`, `ToolbarCard`, local helpers, and Stage 02 `DataTable`. | Normalize only Dashboard presentation primitives without changing data grouping. |
| Accessibility | Chart bars are visual-only; mobile legend is hidden. | Add text/ARIA fallback or ensure chart is not the sole way to understand daily data. |
| Hard-coded styles | Several local fixed heights, widths, and arbitrary text sizes remain. | Replace where safe with Stage 01 scale or shared component props. |

### P2

| Area | Finding | Recommended Polish |
| --- | --- | --- |
| Page header | Header is structurally correct but can be visually tuned for SaaS hierarchy. | Keep title/actions; reduce competing visual weight around quick links. |
| KPI descriptions | Subtext can wrap unevenly, especially expense breakdown. | Improve line-height and truncation without changing text meaning. |
| Cost breakdown | Local progress rows are functional but not fully standardized. | Align spacing, tone, and label hierarchy with other summary panels. |
| Alert area | Alerts are links but visual priority is modest. | Improve action affordance while preserving `href`. |
| Low stock | Cards are readable but locally styled. | Align with shared card tone and density. |
| Recent sessions | DataTable adoption is good; sticky header and skeleton rows remain deferred from Stage 02. | Keep as-is unless Stage 02 deferred work is addressed separately. |
| Chart labels | Day labels use very small text. | Raise readability if it does not increase density too much. |

## Detailed Dashboard Audit

| # | Area | Current State | Priority | Notes / Required Direction |
| --- | --- | --- | --- | --- |
| 1 | Page header | Uses `PageHeader` with eyebrow, title, description, and quick navigation buttons. | P2 | Structurally correct. Keep route targets. Minor density and hierarchy tuning only. |
| 2 | Report period filter | Uses `ToolbarCard`, `Select`, and `Input`. | P1 | Migrate to Stage 02 `FilterBar`; keep one-line compact behavior and existing state handlers. |
| 3 | KPI revenue | Uses `MetricCard` tone `income`, value from `data.totalIncome`. | P1 | Migrate to `StatCard`; preserve total, icon, sessions, and player count. |
| 4 | KPI expense | Uses `MetricCard` tone `expense`, value from `data.totalExpense`, subtext from `formatCostSub`. | P1 | Migrate to `StatCard`; do not change category math. Review long cost subtext wrapping. |
| 5 | KPI profit | Uses `MetricCard` tone `profit`; negative value receives danger class. | P1 | Migrate to `StatCard`; preserve negative-profit visual distinction and `unpaidAmount` subtext. |
| 6 | KPI inventory | Uses `MetricCard` tone `inventory`; value formats tube/ball plus total balls. | P1 | Migrate to `StatCard`; preserve `formatTubeBall` output and inventory value. |
| 7 | Cashflow chart | Local bar chart renders `dailyFinance` with custom `Bar` and `Legend`. | P1 | Keep local chart data logic. Improve semantic accessibility and tokenized sizing only. |
| 8 | Cost breakdown | Local `DashboardInfoCard` and `BreakdownRow`. | P2 | Keep categories and amounts. Polish visual hierarchy and progress tone. |
| 9 | Alerts | Uses linked cards inside `DashboardInfoCard`. | P2 | Preserve alert links. Improve scan priority and action affordance. |
| 10 | Low stock | Uses local low-stock cards with `formatTubeBall`. | P2 | Preserve product and quantity display. Align card tone with inventory semantics. |
| 11 | Recent sessions table | Already uses Stage 02 `DataTable` with exact columns and detail link. | P2 | Good baseline. Do not change columns, route, status, or formatters. |
| 12 | Loading/empty/error | Loading/error use `NoticeCard`; empty states use `EmptyState` in some sections. | P1 | Migrate loading/error to Stage 02 feedback states if behavior stays equivalent. |
| 13 | Light mode | Uses semantic tokens through shared components, but visual QA still required. | P1 | Verify KPI tones, tags, chart bars, table row contrast, and focus states. |
| 14 | Dark mode | Current design is dark-mode-first and mostly semantic. | P1 | Verify no labels/subtext sink into tinted metric backgrounds. |
| 15 | Desktop/laptop/tablet/mobile | Page has Dashboard min-width and table horizontal overflow. | P1 | Ensure page-level horizontal scrolling is not the default mobile experience; keep table overflow. |
| 16 | Accessibility | Table semantics are delegated to `DataTable`; chart needs stronger fallback. | P1 | Add accessible chart description or equivalent summary during implementation. |
| 17 | Shared component usage | Uses `PageShell`, `PageHeader`, `SectionCard`, `Button`, `Input`, `Select`, `DataTable`, `EmptyState`; does not yet use `FilterBar` or `StatCard`. | P1 | Stage 03 should adopt missing Stage 02 primitives first. |
| 18 | Hard-coded styles | Local fixed heights, widths, text sizes, and progress bar styles remain. | P1/P2 | Replace only presentation constants; do not alter data or layout meaning. |

## Hard-Coded Style Inventory

The following patterns should be reviewed during Stage 03 implementation:

- `PageShell minWidth="min-w-[720px] md:min-w-0"`
- report control width classes such as `sm:w-28`
- chart sizing such as `h-40`, `w-2`, `min-w-[28px]`, `gap-0.5`, and `text-[10px]`
- support card height constraints such as `min-h-[300px]`, `max-h-[220px]`, and `min-h-[360px]`
- local metric subtext and breakdown row classes
- local chart tone mapping in `chartToneClass`
- local helper components: `DashboardInfoCard`, `BreakdownRow`, `Bar`, and `Legend`

These are not automatically wrong. They are candidates for token replacement or local polish if they conflict with Stage 01/02 consistency.

## Shared Component Adoption Gaps

Required for Stage 03:

- Replace report period `ToolbarCard` pattern with `FilterBar`.
- Replace KPI `MetricCard` pattern with `StatCard`.
- Prefer Stage 02 feedback states for loading/error if no behavior changes are needed.
- Keep `DataTable` for recent sessions.

Not required for Dashboard:

- `Dialog`
- `Drawer`
- `ActionMenu`
- `FormSection`

## Screen-State Audit

| State | Current Handling | Priority | Direction |
| --- | --- | --- | --- |
| Loading | `NoticeCard` text-only loading message. | P1 | Use shared loading state or richer non-blocking skeleton only if safe. |
| Error | `NoticeCard tone="danger"` with error message. | P1 | Use shared error state; preserve exact error message source. |
| Empty KPI data | Whole KPI section depends on `data`. | P2 | Keep behavior; avoid inventing placeholder data. |
| Empty cost breakdown | Uses `EmptyState`. | P2 | Acceptable; align density with other cards. |
| Empty alerts | Uses `EmptyState`. | P2 | Acceptable. |
| Empty low stock | Uses `EmptyState`. | P2 | Acceptable. |
| Empty recent sessions | Delegated to `DataTable` empty message. | P2 | Acceptable. |

## Responsive Audit

| Viewport | Risk | Priority | Direction |
| --- | --- | --- | --- |
| Desktop 1440px | Layout likely fits, but secondary cards can compete with main chart. | P2 | Preserve high-level structure; improve visual rhythm. |
| Laptop 1280px | KPI cards and chart should fit; table scroll is acceptable. | P2 | Verify action buttons and filter controls do not crowd. |
| Tablet landscape | Good target for operations; density should remain scan-friendly. | P1 | Keep touch targets large and avoid deep nesting. |
| Tablet portrait | Page-level min-width may create awkward horizontal scroll. | P1 | Prefer responsive stacking outside the table. |
| Mobile | Dashboard is secondary but should remain reviewable. | P1 | Avoid full-page clipping; allow horizontal overflow only inside data-heavy regions. |

## Accessibility Audit

| Area | Finding | Priority | Direction |
| --- | --- | --- | --- |
| Page header | Semantic heading likely acceptable through `PageHeader`. | P2 | Preserve heading hierarchy. |
| Filter controls | Native/select/input controls are present. | P2 | Ensure labels remain clear after FilterBar migration. |
| KPI cards | Visual cards need clear labels and values. | P2 | Preserve text labels; avoid color-only meaning. |
| Chart | Bars use visual height/color; no explicit data table fallback in component. | P1 | Provide accessible description or summary that does not alter business data. |
| Recent sessions | `DataTable` should provide table semantics. | P2 | Keep column headers and numeric alignment. |
| Focus states | Inherited from primitives. | P1 | Verify after migration, especially links inside alert cards. |

## Business Logic Risk Notes

Do not change:

- `chartMax` calculation
- `dailyFinance` mapping
- `formatCostSub`
- `formatTubeBall`
- recent session column fields
- `getSessionStatusLabel`
- `formatCurrency`
- route strings for quick links and detail links
- `useDashboardSummary` parameters or invocation timing

If any visual improvement appears to require new derived data, stop and document the need before implementation.

## Recommended Stage 03 Implementation Order

1. Replace report period toolbar with `FilterBar`.
2. Replace four KPI cards with `StatCard`.
3. Standardize loading and error states.
4. Polish chart presentation and accessibility without changing data logic.
5. Polish secondary cards: cost breakdown, alerts, and low stock.
6. Verify recent sessions `DataTable` remains unchanged in data, columns, and route behavior.
7. Run visual QA across light/dark and desktop/tablet/mobile.

## Stage 03 Audit Decision

Decision: PASS WITH NOTES for moving to implementation planning.

Notes:

- No P0 blockers found.
- P1 issues are mostly consistency, accessibility, and responsive presentation.
- Stage 03 can proceed safely if implementation remains confined to Dashboard presentation and shared component adoption.
