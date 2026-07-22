# Module Scorecard

## App Shell

Score: 8.0 / 10.

Strengths:

- root navigation respects product governance
- compact operational shell
- profile/status badges are clear
- mobile nav has local overflow instead of page overflow

Risks:

- mobile nav needs browser verification for long labels
- localStorage sidebar preference remains presentation-adjacent and should stay unchanged

## Dashboard

Score: 8.2 / 10.

Strengths:

- clear business overview
- shared `StatCard`, `FilterBar`, `DataTable` and feedback usage
- semantic profit and low-stock tone

Risks:

- chart density and long-currency rendering need screenshot QA
- some chart color mapping is local and should be reviewed only visually

## Schedule

Score: 8.2 / 10.

Strengths:

- canonical flow is clear
- create/edit/delete confirmation uses shared dialog
- date and session cards are touch-friendly

Risks:

- browser QA needed for dense session cards on small mobile
- local sorting must remain untouched

## Session Workspace

Score: 7.9 / 10.

Strengths:

- session preparation workflow remains clear
- payment and completion sections have good operational density
- shared dialog used for completion confirmation

Risks:

- `session-detail-client.tsx` remains 758 lines
- completion summary contains dense finance/inventory text that needs visual QA

## Runtime

Score: 7.9 / 10.

Strengths:

- workflow clarity is strongest product area
- tablet-first structure is preserved
- interaction priority is appropriate for operators

Risks:

- custom operational palette has many direct slate/cyan/emerald/amber classes
- runtime dashboard remains 656 lines
- real tablet testing remains required before RC

## Finance

Score: 8.2 / 10.

Strengths:

- shared KPI and DataTable adoption is good
- transaction form is compact and clear
- finance calculations stay in parent/domain helpers

Risks:

- long transaction title and mobile card readability need browser QA
- finance presentation remains 581 lines

## Inventory

Score: 8.0 / 10.

Strengths:

- product and movement tables are readable
- stock/unit presentation is explicit
- import/outbound forms keep business semantics visible

Risks:

- inventory presentation is 1047 lines
- stock/currency display requires mobile and tablet QA

## Users

Score: 7.8 / 10.

Strengths:

- role and status labels are text-based, not color-only
- permission matrix is explicit
- sensitive flows remain server-authorized

Risks:

- users presentation is 760 lines
- custom wide table and permission matrix need keyboard/browser QA

## Settings

Score: 7.7 / 10.

Strengths:

- missing capabilities are not faked
- destructive actions are separated
- local settings behavior is preserved

Risks:

- settings presentation is 727 lines
- settings nav and destructive confirmations need device QA

