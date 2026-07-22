# Sprint 12.7E Inventory Regression Matrix

## Regression Scope

This sprint validates source-level preservation and command validation. Live stock mutation scenarios were not executed against production data.

| Item | Result | Evidence |
| --- | --- | --- |
| `current_stock` / `quantityBall` unchanged | PASS | `InventoryPageClient`, repository, service and API untouched. |
| `average_cost` unchanged | PASS | Inventory calculation files untouched. |
| Movement calculation unchanged | PASS | Movement submit handlers and repository untouched. |
| Tube-to-piece conversion unchanged | PASS | `formatTubes` formula unchanged. |
| Movement type semantics unchanged | PASS | Movement values unchanged; `PLAY_USAGE` remains current consumption source value. |
| Product payload unchanged | PASS | Product submit handler untouched. |
| Import payload unchanged | PASS | Import submit handler untouched. |
| Sale/consumption payload unchanged | PASS | Outbound submit handler untouched. |
| Adjustment payload unchanged | PASS | Adjustment submit handler untouched. |
| Validation unchanged | PASS | No validation logic edited. |
| API unchanged | PASS | No API files edited. |
| Mutation unchanged | PASS | Hooks and mutation calls untouched. |
| Low-stock presentation | PASS | Added presentation-only badge from existing `quantityBall` and `ballsPerTube`. |
| Out-of-stock presentation | PASS | Added presentation-only zero-stock badge. |
| Consumption not always danger | PASS | `PLAY_USAGE` quantity tone is warning, not danger. |

## Command Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS
- `git diff --check`: PASS
- protected backend/logic diff: PASS

## Deferred

- Browser screenshot QA for Inventory desktop/tablet/mobile and light/dark.
- Seeded mutation scenarios for import, sale, consumption and adjustment.
