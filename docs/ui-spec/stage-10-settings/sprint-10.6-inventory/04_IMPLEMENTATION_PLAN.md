# Inventory Settings Implementation Plan

Status: NOT APPLICABLE

## Preconditions

Inventory Settings UI can only be implemented for existing config keys with persistence and handlers. The current source does not provide stock/inventory settings such as low-stock threshold, preferred stock display, default movement unit, or inventory display preference.

## Setting Matrix

| Setting | Current source | Used by | Default | Validation | Persistence | Handler | Required preservation |
|---|---|---|---|---|---|---|---|
| Low-stock threshold | Dashboard repository expression `quantity_ball <= balls_per_tube * 2` | Dashboard low stock panel | Existing hard-coded rule | Protected repository behavior | None as setting | None | READ_ONLY; do not implement. |
| Preferred stock display | Inventory presentation helpers | Inventory UI | Existing display behavior | Existing helper behavior | None | None | MISSING as setting; do not implement. |
| Default product tube quantity | Product form default and repository fallback | Product create flow | `12` in current source | Existing product validation | None as setting | Product form/repository handlers | READ_ONLY/MISSING as setting; do not implement. |
| Default movement unit | Existing movement forms | Movement create flow | Existing form behavior | Existing validation | None | Existing handlers | MISSING; do not implement. |
| Inventory display preferences | None | None | Not applicable | None | None | None | MISSING; do not implement. |
| `current_stock` / `quantity_ball` | Database/repository | Inventory calculations | Existing data | Protected | Database | Protected mutations | PROTECTED; do not expose as setting. |
| `average_cost` / weighted average | Repository calculations | Inventory costs | Existing formula | Protected | Database | Protected mutations | PROTECTED; do not expose as setting. |
| Movement semantics/formula | Repository/API | Import/sale/consumption/adjustment | Existing behavior | Protected | Database/API | Protected mutations | PROTECTED; do not expose as setting. |

## Implementation Decision

- Do not modify source code.
- Do not add Inventory Settings controls.
- Do not hard-code `12` in Settings.
- Do not turn per-product `tube_quantity` or product form defaults into global settings.
- Do not expose stock calculation, average cost, movement semantics, or adjustment formula.

## Protected Files

- `src/components/inventory/inventory-page-client.tsx`
- `src/repositories/inventory-repository.ts`
- `src/services/inventory-service.ts`
- `src/app/api/inventory/**`
- `prisma/**`
- Dashboard inventory summaries and low-stock repository logic.
- Session completion inventory movement logic.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
