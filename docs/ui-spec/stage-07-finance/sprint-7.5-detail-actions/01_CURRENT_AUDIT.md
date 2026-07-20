# Current Audit

Status: Complete

Current Finance list is read-only and has no row action menu.

Sprint 7.5 is therefore a safety checkpoint: the correct implementation is to avoid introducing new detail, edit, delete, dialog, drawer, or action-menu behavior.

## Source Evidence

- `src/components/finance/finance-page-client.tsx` renders the transaction list through `DataTable`.
- The current `transactionColumns` render type, content, quantity/unit price, amount, and created time only.
- No `actions` prop is passed to `DataTable`.
- No row detail handler exists in the Finance page.
- No row edit handler exists in the Finance page.
- No row delete handler exists in the Finance page.
- `useFinanceMutations()` currently exposes create behavior used by the manual entry form; there is no existing finance edit/delete UI flow in the page.

## Action Preservation Table

| Action | Visibility condition | Permission | Handler | Arguments | Mutation | Required preservation |
| --- | --- | --- | --- | --- | --- | --- |
| Detail | Not present | N/A | Not present | N/A | N/A | Do not add in Sprint 7.5 |
| Edit | Not present | N/A | Not present | N/A | N/A | Do not add in Sprint 7.5 |
| Delete | Not present | N/A | Not present | N/A | N/A | Do not add in Sprint 7.5 |
| Action menu | Not present | N/A | Not present | N/A | N/A | Do not add in Sprint 7.5 |

## Finding

No source-code presentation work is allowed for Sprint 7.5 because there are no existing finance row actions to visually refine.

Adding action UI would create new transaction mutability behavior and violate the Finance Safety Contract.
