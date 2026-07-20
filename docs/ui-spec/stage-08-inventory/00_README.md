# Stage 08 — Inventory UX

Status: Complete

## Objective

Optimize the Inventory presentation layer for shuttlecock stock operations.

Stage 08 may improve:

- UI and UX.
- Page layout.
- Typography hierarchy.
- Spacing and density.
- Component consistency.
- Responsive behavior.
- Light and dark mode presentation.
- Accessibility.
- Empty, loading, and error states.

Stage 08 must not change inventory business logic.

## Source Scope

Primary presentation target:

- `src/components/inventory/inventory-page-client.tsx`

Read-only domain context:

- `src/app/inventory/page.tsx`
- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/**`
- `src/types/domain.ts`
- `prisma/**`

## Safety Rule

If a UI improvement requires changing stock calculation, movement semantics, API payloads, repository behavior, hook behavior, validation, or permission logic, do not implement it in Stage 08. Record it as Out Of Scope.

## Expected Workflow

1. Complete baseline audit. Done.
2. Confirm allowed files and protected files. Done.
3. Implement one sprint at a time. Done.
4. Validate with lint, typecheck, build, and DB schema guard at checkpoints. Done.
5. Update sprint completion reports. Done.
6. Create final Stage 08 completion report. Done: `docs/ui-spec/stage-08-inventory/13_STAGE_COMPLETION_REPORT.md`.
