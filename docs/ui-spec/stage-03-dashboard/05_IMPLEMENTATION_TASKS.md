# Implementation Plan

Status: Ready for review, no implementation started

This plan is based on `01_CURRENT_UI_AUDIT.md`. It intentionally limits Stage 03 to Dashboard presentation work only.

## Non-Negotiable Rule

Do not add:

- new KPI
- new quick action
- new data source
- new query
- new calculation
- new API behavior

Dashboard must continue to render the existing `DashboardSummary` data only.

## Files To Modify

Primary implementation file:

- `src/components/dashboard/dashboard-page-client.tsx`

Documentation files during completion:

- `docs/ui-spec/stage-03-dashboard/07_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

Allowed only if validation reveals a shared primitive display bug directly blocking Dashboard adoption:

- `src/components/ui/data-table.tsx`
- `src/components/ui/filter-bar.tsx`
- `src/components/ui/stat-card.tsx`
- `src/components/ui/feedback-state.tsx`

Any shared primitive change must remain presentation-only and must not introduce Dashboard-specific logic.

## Files To Read Only

Read-only implementation context:

- `src/hooks/use-dashboard-summary.ts`
- `src/services/dashboard-service.ts`
- `src/repositories/dashboard-repository.ts`
- `src/types/domain.ts`
- `src/app/dashboard/page.tsx`
- `src/app/api/dashboard/summary/route.ts`

Read-only UI context:

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/page-layout.tsx`
- `src/components/ui/data-table.tsx`
- `src/components/ui/filter-bar.tsx`
- `src/components/ui/stat-card.tsx`
- `src/components/ui/feedback-state.tsx`

## Protected Files

Do not edit:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- `src/lib/badminton-store.ts`
- runtime components
- runtime hooks
- permission logic
- auth/session logic
- finance calculation helpers
- inventory calculation helpers
- schedule/session completion logic

Protected runtime modules remain out of scope:

- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`

## Stage 02 Components To Use

Required adoption:

- `FilterBar` for the report period controls.
- `StatCard` for revenue, expense, profit, and inventory KPI cards.
- `DataTable` for recent sessions, already adopted and must be preserved.
- `LoadingState` and `ErrorState` from feedback primitives where safe.

Allowed existing primitives:

- `PageShell`
- `PageHeader`
- `SectionCard`
- `Button`
- `Input`
- `Select`
- `EmptyState`

Not expected for Dashboard:

- `Dialog`
- `Drawer`
- `ActionMenu`
- `FormSection`

## New Components

No new shared component is required for Stage 03.

Dashboard-local helper components may remain if they are presentation-only:

- `DashboardInfoCard`
- `BreakdownRow`
- `Bar`
- `Legend`

If a local helper is edited, it must not fetch, mutate, derive new business data, or reinterpret finance/inventory/session values.

## Business Logic Risk Assessment

### High Risk

These must not be changed:

- `useDashboardSummary({ period, month, year })`
- `period`, `month`, and `year` state semantics
- `chartMax`
- `dailyFinance.map`
- `formatCostSub`
- `formatTubeBall`
- `recentSessionColumns`
- route strings: `/schedule`, `/finance`, `/inventory`, `/sessions/${session.id}`
- `formatCurrency`
- `getSessionStatusLabel`

### Medium Risk

Safe only if values and fields stay identical:

- KPI card migration from `MetricCard` to `StatCard`
- loading/error primitive replacement
- responsive wrapping of KPI/filter/chart areas
- cost breakdown visual polish
- alert card visual polish
- low-stock visual polish

### Low Risk

Presentation-only changes:

- token replacement
- spacing/radius alignment
- text hierarchy classes
- chart label readability
- link/button visual states

## Rollback Strategy

Each task is intentionally small and rollback-safe:

- Task 2 can be reverted independently to restore `ToolbarCard`.
- Task 3 can be reverted independently to restore `MetricCard`.
- Task 4 can be reverted independently to restore `NoticeCard`.
- Task 5 and Task 6 should avoid touching data expressions, making visual rollback straightforward.
- Task 7 should only verify DataTable behavior; no functional migration is expected.

## Task Order

### Task 0 - Preflight

Actions:

- Read Stage 03 docs.
- Read `src/components/dashboard/dashboard-page-client.tsx`.
- Run `git status --short`.
- Confirm protected-area diff is empty before implementation.
- Confirm no unrelated dirty files block Dashboard work.

Expected file changes:

- None.

Validation:

- No command required unless protected diff is unclear.

Stop criteria:

- Protected files are dirty for unrelated reasons and cannot be separated.
- Dashboard source has unresolved conflict or broken imports.

### Task 1 - Exact JSX Plan

Actions:

- Mark exact JSX blocks to touch:
  - report period toolbar
  - KPI grid
  - loading/error states
  - chart accessibility wrapper
  - supporting info cards
- List imports to add/remove before editing.
- Confirm all state, handlers, and helper functions to preserve.

Expected file changes:

- None.

Validation:

- No command required.

Stop criteria:

- Any needed improvement requires changing data shape or query behavior.

### Task 2 - Report Period Control

Goal:

- Migrate report period controls from `ToolbarCard` pattern to `FilterBar`.

Preserve:

- `period`
- `month`
- `year`
- `setPeriod`
- `setMonth`
- `setYear`
- `Select`
- `Input`
- query parameters passed to `useDashboardSummary`

Allowed changes:

- layout wrapper
- spacing
- compact responsive arrangement
- labels/descriptions if they do not change meaning

Expected file changes:

- `src/components/dashboard/dashboard-page-client.tsx`

Validation after task:

- `npm run lint`
- `npm run typecheck`

Rollback:

- Revert only the report-period JSX and imports.

### Task 3 - KPI Cards

Goal:

- Migrate the four Dashboard KPIs from `MetricCard` to `StatCard`.

Preserve:

- revenue value: `data.totalIncome`
- expense value: `data.totalExpense`
- profit value: `data.totalProfit`
- inventory display: `formatTubeBall(data.inventory.totalBalls)`
- subtexts and their meanings
- icons
- semantic tones
- negative profit visual distinction

Allowed changes:

- consistent card height
- label/value/subtext hierarchy
- tone usage through `StatCard`

Expected file changes:

- `src/components/dashboard/dashboard-page-client.tsx`

Validation after task:

- `npm run lint`
- `npm run typecheck`

Rollback:

- Revert KPI grid JSX and imports.

### Task 4 - Loading, Empty, Error States

Goal:

- Use Stage 02 feedback states where safe.

Preserve:

- `error.message`
- all empty-state text meaning
- conditional rendering order
- no placeholder data

Allowed changes:

- loading primitive
- error primitive
- consistent empty-state card density

Expected file changes:

- `src/components/dashboard/dashboard-page-client.tsx`

Validation after task:

- `npm run lint`
- `npm run typecheck`

Rollback:

- Restore `NoticeCard` loading/error blocks.

### Task 5 - Supporting Insight Cards

Goal:

- Polish cost breakdown, alerts, and low-stock cards to align with Stage 01/02 visual system.

Preserve:

- `data.costBreakdown`
- cost category labels and amounts
- alert `href`
- alert label/body
- low-stock product name, quantity, and stock value
- empty-state behavior

Allowed changes:

- tokenized spacing
- better typography hierarchy
- stronger link affordance
- semantic tone cleanup

Expected file changes:

- `src/components/dashboard/dashboard-page-client.tsx`

Validation after task:

- `npm run lint`
- `npm run typecheck`

Rollback:

- Revert supporting-card helper and JSX changes.

### Task 6 - Cashflow Chart Presentation

Goal:

- Improve chart readability and accessibility while keeping the same chart data.

Preserve:

- `data.dailyFinance`
- `chartMax`
- `Bar` percentage calculation
- income/expense/profit/loss meaning
- day grouping

Allowed changes:

- chart wrapper spacing
- label size if still compact
- legend visibility
- `aria-label` or accessible text summary
- tokenized bar colors

Expected file changes:

- `src/components/dashboard/dashboard-page-client.tsx`

Validation after task:

- `npm run lint`
- `npm run typecheck`

Rollback:

- Revert chart helper and chart JSX changes.

### Task 7 - Recent Sessions Verification

Goal:

- Confirm recent sessions remain on Stage 02 `DataTable`.

Preserve exactly:

- column list
- column order
- formatters
- numeric alignment
- status label
- detail link route
- data source: `data.recentSessions`

Expected file changes:

- None unless a Dashboard-only visual wrapper is required.

Validation after task:

- `npm run lint`
- `npm run typecheck`

Stop criteria:

- Any requested table improvement requires changing columns, data grouping, route, or repository behavior.

### Task 8 - Responsive And Theme QA

Review:

- light mode
- dark mode
- desktop 1440px
- laptop 1280px
- tablet landscape
- tablet portrait
- mobile smoke

Check:

- no page-level clipping
- report controls stay usable
- KPI cards wrap cleanly
- chart remains readable
- recent sessions horizontal scroll remains usable
- focus states remain visible

Expected file changes:

- None unless QA finds Dashboard-only presentation defects.

Validation:

- `npm run lint`
- `npm run typecheck`

### Task 9 - Full Validation

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

Also check:

- `git diff -- src/app/api src/repositories src/services prisma src/lib/badminton-store.ts`
- protected diff must be empty
- no runtime component diff
- no permission/auth diff

Stop criteria:

- Any validation failure that requires business logic changes.
- Any protected-area diff.
- Any route, API, repository, service, Prisma, runtime, permission, finance, inventory, or session calculation change.

### Task 10 - Completion Report

Create:

- `docs/ui-spec/stage-03-dashboard/07_COMPLETION_REPORT.md`

Update:

- `docs/ui-spec/PROJECT_PROGRESS.md`

Record:

- task status
- changed files
- unchanged protected files
- Stage 02 components adopted
- validation output
- deferred issues
- final decision

## Validation Commands

Minimum after each implementation task:

```bash
npm run lint
npm run typecheck
```

Final validation:

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Protected diff check:

```bash
git diff -- src/app/api src/repositories src/services prisma src/lib/badminton-store.ts
```

Optional source-scope check:

```bash
git diff --name-only
```

## Completion Criteria

Stage 03 implementation is complete only when:

- Dashboard is the only implementation screen changed.
- No new KPI, quick action, or data source was added.
- Report period behavior is unchanged.
- KPI values match existing `DashboardSummary` fields.
- Daily chart uses the same `dailyFinance` data.
- Cost breakdown uses the same categories and amounts.
- Alert links preserve their original destinations.
- Low-stock values preserve existing inventory data.
- Recent sessions table keeps the same columns and routes.
- Light and dark mode remain readable.
- Desktop, laptop, tablet, and mobile smoke checks pass.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `npm run guard:no-db-schema-automation` passes.
- Protected diff is empty.
- Completion report is written.

## Deferred Out Of Scope

Do not include in Stage 03 unless separately approved:

- redesigning Dashboard data model
- adding new dashboard metrics
- adding chart libraries
- changing dashboard API
- changing repository aggregation
- changing finance/inventory/session calculation semantics
- migrating other modules
- app-wide theme redesign
- Stage 02 deferred infrastructure such as sticky `DataTable` header or portal hardening
