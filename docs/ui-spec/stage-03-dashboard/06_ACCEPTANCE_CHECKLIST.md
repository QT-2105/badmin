# Acceptance Checklist

## Scope

- [ ] Only Dashboard implementation was changed.
- [ ] No backend/API/repository/service changes.
- [ ] No Prisma/database changes.
- [ ] No runtime changes.
- [ ] No permission changes.
- [ ] No route changes.
- [ ] No finance calculations changed.
- [ ] No inventory calculations changed.
- [ ] No session calculations changed.

## Dashboard Behavior

- [ ] Report period selection still works.
- [ ] `useDashboardSummary` call is unchanged in meaning.
- [ ] KPI values match existing `DashboardSummary` fields.
- [ ] Cost breakdown uses the same categories and amounts.
- [ ] Cashflow chart uses the same `dailyFinance` data.
- [ ] Recent sessions table keeps the same columns.
- [ ] Recent session detail links still route to `/sessions/[sessionId]`.
- [ ] Quick nav links still route to `/schedule`, `/finance`, and `/inventory`.

## Stage 02 Component Adoption

- [ ] Report period uses `FilterBar` or remains unchanged with documented reason.
- [ ] KPI cards use `StatCard` or remain unchanged with documented reason.
- [ ] Recent sessions uses `DataTable`.
- [ ] Feedback states are used where safe.
- [ ] No component contains Dashboard calculations.

## Visual Quality

- [ ] Page hierarchy is clear.
- [ ] KPI row is visually dominant.
- [ ] Supporting cards are secondary.
- [ ] Chart is readable and not oversized.
- [ ] Recent sessions remain scannable.
- [ ] Light mode contrast is acceptable.
- [ ] Dark mode contrast is acceptable.
- [ ] Focus states remain visible.
- [ ] Disabled/loading states remain readable.

## Responsive Quality

- [ ] Desktop 1440px reviewed.
- [ ] Laptop 1280px reviewed.
- [ ] Tablet landscape reviewed.
- [ ] Tablet portrait reviewed.
- [ ] Mobile smoke test reviewed.
- [ ] No text overlap.
- [ ] No card content clipping.
- [ ] Recent sessions horizontal scroll remains usable.

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run guard:no-db-schema-automation`

## Completion

- [ ] Completion report created.
- [ ] Project progress updated.
- [ ] Protected diff recorded as empty.
- [ ] Deferred issues documented.
- [ ] Final decision recorded.

