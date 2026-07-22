# Business Regression Matrix

## Schedule

| Check | Static Result | Notes |
| --- | --- | --- |
| Create play date | PASS WITH NOTES | Source handlers not changed in Sprint 12.11; live CRUD not executed. |
| Edit play date | PASS WITH NOTES | Source handlers not changed in Sprint 12.11; live CRUD not executed. |
| Delete play date | PASS WITH NOTES | ConfirmationDialog had already replaced browser confirm; handler contract preserved. |
| Create session | PASS WITH NOTES | Session creation payload was not changed in Sprint 12.11. |
| Edit session | PASS WITH NOTES | Edit handler/payload not changed in Sprint 12.11. |
| Delete session | PASS WITH NOTES | Delete handler/payload not changed in Sprint 12.11. |
| Session court count | PASS WITH NOTES | Max-court setting normalization and session court-count logic untouched. |
| Date and time display | PASS WITH NOTES | Presentation only; date/time source untouched. |

## Runtime

| Check | Static Result | Notes |
| --- | --- | --- |
| Add session players | PASS WITH NOTES | Session player API/hooks untouched. |
| Start session | PASS WITH NOTES | Runtime route/state lifecycle untouched. |
| Waiting queue order | PASS WITH NOTES | `badminton-store` untouched; protected diff clean. |
| PRIORITY and WAITING behavior | PASS WITH NOTES | Runtime lifecycle logic untouched. |
| Next-match generation | PASS WITH NOTES | Pairing/generation logic untouched. |
| Manual adjustment | PASS WITH NOTES | Runtime handlers untouched. |
| Apply to selected court | PASS WITH NOTES | Apply handler untouched. |
| Auto-assign available court | PASS WITH NOTES | Court assignment logic untouched. |
| Start match | PASS WITH NOTES | Start handler untouched. |
| End match | PASS WITH NOTES | End handler untouched. |
| Court clearing | PASS WITH NOTES | Court clear behavior untouched. |
| Swap pair | PASS WITH NOTES | Swap handler untouched. |
| `total_matches` | PASS WITH NOTES | Runtime/match counters untouched. |
| Runtime status transition | PASS WITH NOTES | Zustand runtime status transitions untouched. |

## Finance

| Check | Static Result | Notes |
| --- | --- | --- |
| Player revenue | PASS WITH NOTES | Finance calculations untouched. |
| Shuttle sale income | PASS WITH NOTES | Finance categories/payload untouched. |
| Other income | PASS WITH NOTES | Finance category semantics untouched. |
| Court expense | PASS WITH NOTES | Expense category and formula untouched. |
| Shuttle consumption expense | PASS WITH NOTES | Session completion finance/inventory behavior untouched. |
| Extra court expense | PASS WITH NOTES | Category semantics untouched. |
| Other expense | PASS WITH NOTES | Category semantics untouched. |
| Paid/unpaid | PASS WITH NOTES | Payment status logic untouched. |
| Cash/transfer | PASS WITH NOTES | Payment method logic untouched. |
| Session total | PASS WITH NOTES | Session total calculation untouched. |
| Monthly total | PASS WITH NOTES | Report period/filter logic untouched. |
| Profit | PASS WITH NOTES | Profit formula untouched. |

## Inventory

| Check | Static Result | Notes |
| --- | --- | --- |
| Import tubes/pieces | PASS WITH NOTES | Movement payload and conversion logic untouched. |
| Sale | PASS WITH NOTES | SALE semantics untouched. |
| Consumption | PASS WITH NOTES | CONSUMPTION semantics untouched. |
| Adjustment | PASS WITH NOTES | ADJUSTMENT sign semantics untouched. |
| Stock after movement | PASS WITH NOTES | Stock calculation untouched. |
| Tube/piece display | PASS WITH NOTES | Display helpers/formula untouched. |
| Average cost | PASS WITH NOTES | Average-cost formula untouched. |
| Session-linked consumption | PASS WITH NOTES | Session relation and movement logic untouched. |

## Users And Settings

| Check | Static Result | Notes |
| --- | --- | --- |
| Permission visibility | PASS WITH NOTES | Auth/permission files untouched; protected diff clean. |
| Read-only presentation | PASS WITH NOTES | Existing read-only/locked conditions preserved. |
| Existing editable settings | PASS WITH NOTES | `useAppSettings`, `useBranding` and callbacks untouched. |
| Missing capability fake UI | PASS | Missing notifications/export/backup/security settings are not exposed as active editable settings. |
| Save/cancel behavior | PASS WITH NOTES | Save/reset handlers untouched. |
| Dirty state if present | PASS WITH NOTES | Settings dirty state owner untouched. |

## Notes

This regression is static because the project has no existing test or browser automation script. The production build passed and protected diff is clean.
