# Stage 03 - Dashboard

Status: Planning / Audit only

Created: 2026-07-15

## Goal

Redesign the Dashboard as a polished SaaS operations overview while preserving all existing business behavior.

The Dashboard must remain a high-signal operational entry point for:

- period-based revenue, expense, profit, and inventory overview
- daily cashflow scan
- operational attention items
- recent play session review
- quick navigation into Schedule, Finance, and Inventory

## Non-Negotiable Constraints

Do not change:

- dashboard data source
- `useDashboardSummary`
- dashboard query parameters
- dashboard API
- repository logic
- finance calculations
- inventory calculations
- session calculations
- status labels
- route targets
- links/actions
- data shape
- business copy that affects user decisions

## Scope

Allowed:

- Dashboard-only layout refinement
- Dashboard-only visual hierarchy cleanup
- Stage 02 shared component adoption
- better spacing, density, grouping, and responsive behavior
- clearer operational visual prioritization
- better loading, error, and empty presentation

Not allowed:

- changes outside Dashboard
- changes to runtime
- changes to finance/inventory/session logic
- changing report period semantics
- changing chart data source
- changing recent session table columns
- adding new metrics not already present in `DashboardSummary`

## Source Files

Primary implementation file for future Stage 03 work:

- `src/components/dashboard/dashboard-page-client.tsx`

Read-only dependency context:

- `src/hooks/use-dashboard-summary.ts`
- `src/services/dashboard-service.ts`
- `src/repositories/dashboard-repository.ts`
- `src/types/domain.ts`

## Stage 03 Output

This stage should end with:

- Dashboard redesigned using Stage 02 primitives where appropriate
- business logic unchanged
- protected files unchanged
- validation passing
- completion report created

