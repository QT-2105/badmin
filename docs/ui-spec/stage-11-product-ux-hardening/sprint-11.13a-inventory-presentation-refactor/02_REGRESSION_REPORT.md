# Sprint 11.13A — Inventory Presentation Refactor Regression Report

## Scope

Regression focused on source-level preservation after presentation decomposition.

## Source Regression

| Area | Result | Evidence |
| --- | --- | --- |
| Query orchestration | PASS | Inventory hooks remain in `InventoryPageClient`. |
| Mutation orchestration | PASS | Product and movement mutations remain in `InventoryPageClient`. |
| Form state ownership | PASS | Parent owns product/import/outbound/report/pagination state. |
| Permission data | PASS | `hasPermission(currentUser ?? null, 'inventory.manage')` remains in parent. |
| Product payload | PASS | `productForm` create/update payload remains parent-owned. |
| Import payload | PASS | `movementType: 'IMPORT'` payload object is unchanged in parent. |
| Outbound payload | PASS | `SALE`, `PLAY_USAGE`, `ADJUSTMENT`, `OTHER` payload branching remains unchanged in parent. |
| Delete payload | PASS | Delete mutation still receives selected product id. |
| Movement order | PASS | `sortedMovements` still sorts by `createdAt` descending in parent. |
| Movement pagination | PASS | `visibleMovements` still slices sorted movements by current page and page size in parent. |
| Inventory calculation | PASS | No service/repository/API/schema file changed. |

## Validation Results

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run guard:no-db-schema-automation` | PASS |
| `git diff --check` | PASS |

## Protected Diff

Command checked:

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Result: no output.

## UI Behavior Comparison

| UI area | Result |
| --- | --- |
| Inventory page header | Preserved. |
| Report period toolbar | Preserved. |
| KPI summary | Preserved. |
| Product table and mobile cards | Preserved; moved to `ProductTableSection`. |
| Product create/edit form | Preserved; state and submit handler stay in parent. |
| Product delete confirmation | Preserved; dialog state and delete handler stay in parent. |
| Import form | Preserved; state and submit handler stay in parent. |
| Outbound form | Preserved; state and submit handler stay in parent. |
| Movement table and pagination | Preserved; sort/pagination stay in parent. |

## Manual Browser QA

Not executed in this sprint. Deferred to Stage 11 final browser/device QA.

## Final Regression Result

PASS WITH NOTES
