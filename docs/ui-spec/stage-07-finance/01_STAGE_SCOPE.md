# Stage Scope

Status: Draft

## In Scope

Presentation-only improvements for the Finance module:

- page layout and hierarchy
- report period filter presentation
- KPI card presentation
- create transaction form presentation
- transaction list readability
- transaction badges and amount emphasis
- loading, empty, error, disabled, hover, and focus states
- responsive layout for desktop, laptop, tablet, and mobile
- light/dark theme parity
- accessibility labels and keyboard focus styling

## Out of Scope

Stage 07 must not add, remove, or reinterpret finance behavior:

- no new transaction type
- no new adjustment type
- no new category
- no new report period
- no new filter behavior
- no calculation changes
- no API or payload changes
- no repository/service changes
- no database or Prisma changes
- no permission changes
- no mutation/cache behavior changes

## Source Area

Primary UI target:

- `src/app/finance/page.tsx`
- `src/components/finance/finance-page-client.tsx`

Read-only dependency context:

- `src/hooks/use-finance.ts`
- `src/services/finance-service.ts`
- `src/repositories/finance-repository.ts`
- `src/app/api/finance/transactions/route.ts`
- `src/lib/finance-calculation.ts`
- `src/types/domain.ts`
- shared UI primitives under `src/components/ui/`

## Completion Boundary

Stage 07 is complete only when Finance UI is visually consistent and full validation passes without any protected logic diff.
