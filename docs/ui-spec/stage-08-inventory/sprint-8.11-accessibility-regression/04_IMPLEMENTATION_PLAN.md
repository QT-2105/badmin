# Implementation Plan

## Allowed Source File

- `src/components/inventory/inventory-page-client.tsx`

## Protected Files

- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/**`
- `src/types/domain.ts`
- `prisma/**`

## Plan

1. Add stable field ids to Inventory-only form primitives.
2. Associate visible helper text with inputs through `aria-describedby`.
3. Preserve native `required` and add `aria-required` without changing validation.
4. Wrap Inventory loading/error notices in safe live regions.
5. Confirm `DataTable` semantics remain native table semantics.
6. Verify no handler, payload, mutation, query key, calculation, or movement semantic changed.
7. Run validation:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run guard:no-db-schema-automation`
8. Confirm protected files have no diff.

## Out of Scope

- Executing production stock mutation scenarios without an isolated test harness.
- Changing inventory validation, stock calculation, movement creation, or cache invalidation.
- Adding new tests or fixtures that would require database setup decisions outside Presentation Layer scope.
