# Current Audit

Status: Complete

## Audited Files

- `src/app/finance/page.tsx`
- `src/components/finance/finance-page-client.tsx`
- `src/hooks/use-finance.ts`
- `src/services/finance-service.ts`
- `src/repositories/finance-repository.ts`
- `src/app/api/finance/transactions/route.ts`
- `src/lib/finance-calculation.ts`
- `src/types/domain.ts`
- `src/components/ui/*` inventory for shared primitive availability

## Summary

Finance UI is concentrated in `FinancePageClient`. Data fetching, creation, calculations, period filtering, sorting, pagination, and permission checks are already wired. Stage 07 must only improve presentation and component consistency.

## Audit Areas

- Finance route: `/finance`, protected by `requirePageUser('/finance')`.
- Finance page: `FinancePageClient` inside `AppShell`.
- Page header: shared `PageHeader`, eligible for spacing/copy polish only.
- Report period filters: `reportPeriod`, `reportMonth`, `reportYear`; protected query contract.
- KPI cards and finance summary: revenue, expense, profit from `getFinanceTotals`.
- Form tao phieu: controlled form, conditional by `finance.manage`.
- Entry type selector: `INCOME`/`EXPENSE`, `NORMAL`/`DEDUCTION`.
- Category selector: current values must not change.
- Quantity: controlled number input, protected value.
- Unit price: controlled number input, protected value.
- Total amount: repository computes from `quantity x unitPrice` when not provided.
- Payment method/status: not exposed on this page; still protected globally.
- Session relation: optional data contract exists, manual form does not choose session.
- Transaction list: custom grid, accessible table semantics are weak.
- Transaction actions: no row-level transaction actions currently exist.
- Empty state: `visibleTransactions.length === 0`.
- Loading state: `isLoading`.
- Error state: query error and action error.
- Light/dark: needs contrast validation for badges/amounts.
- Desktop/tablet/mobile: list overflow and form wrapping need attention.
- Accessibility: visible labels exist, list semantics need improvement.
- Hard-coded styles: repeated grid/spacing/table presentation classes.
- Shared components: partial adoption; Stage 02 primitives available.
- Finance dependencies: hook/service/repository/API/calculation/domain are protected.
- Protected logic/files: documented in `03_PROTECTED_FILES.md` and stage safety contract.

## P0 Findings

- Custom transaction list needs accessible table semantics and robust light/dark contrast.
- Form migration could accidentally send wrong payload if controlled fields are rewired.
- Any change to amount sign, report period, date range, sort order, or total calculation would corrupt finance reporting.
- Tablet/mobile overflow must not hide submit, filters, or financial audit data.
- Action labels and deduction badges must remain distinguishable in light/dark mode.

## P1 Findings

- KPI/form/filter/list use mixed older and newer primitives.
- Create form density and responsive alignment need refinement.
- Hierarchy between filters, KPIs, form, and list can be clearer.
- Table readability and numeric alignment can improve.
- Shared component adoption should be safer and more consistent.

## P2 Findings

- Hover/focus polish can improve.
- Motion should remain minimal.
- Empty/loading copy can be clearer without changing behavior.

## Dependency Graph

Recorded in `../06_COMPONENT_DEPENDENCY_GRAPH.md`.

Required baseline:

```text
Finance Page
-> Report Filter
-> Finance Query
-> Summary Data
```

```text
Finance Page
-> Entry Form
-> Existing Submit Handler
-> Finance Mutation
```

```text
Finance Page
-> Transaction List
-> Existing Finance Data
-> Existing Actions
```

## Protected Files

Protected source files include:

- `src/app/finance/page.tsx`
- `src/components/finance/finance-page-client.tsx` during Sprint 7.0
- `src/hooks/use-finance.ts`
- `src/services/finance-service.ts`
- `src/repositories/finance-repository.ts`
- `src/app/api/finance/transactions/route.ts`
- `src/lib/finance-calculation.ts`
- `src/types/domain.ts`
- `prisma/**`

## Risks

- Migrating to `DataTable` must preserve visible columns, row data, sort, pagination, and amount formatting.
- Migrating form presentation must not drop controlled values or alter submit payload.
- Submit button disabled state must remain tied to `createTransaction.isPending`.
- Any UI change requiring finance logic changes must be recorded as Out of Scope.
