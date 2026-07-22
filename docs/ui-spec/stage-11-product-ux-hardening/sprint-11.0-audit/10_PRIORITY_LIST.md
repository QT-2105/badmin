# Priority List

## P0

No confirmed P0 issue from static audit.

Potential P0 if implementation or device QA discovers:

- page-level horizontal overflow blocking core actions
- runtime tablet layout unusable
- inaccessible destructive confirmation
- keyboard trap in dialog/drawer/runtime panel
- permission/security action presentation implying unauthorized access
- any UI change requiring protected logic changes

## P1

- Replace Schedule and Inventory native destructive confirmations with shared `Dialog` only after handler preservation tables.
- Review Runtime native leave guard, but treat as protected and do not replace unless exact behavior is preserved.
- Validate Runtime tablet landscape/portrait touch density and overflow.
- Validate Users table and permission matrix container-local overflow and keyboard path.
- Validate Inventory product/movement table overflow and form layout.
- Review overlay stacking, focus return and internal scroll for Dialog, Drawer, Player Quick View, Runtime player list and Match History.
- Presentation-only decomposition candidates:
  - Inventory
  - Session Workspace
  - Settings
  - Runtime
  - Users
  - Finance

## P2

- Normalize hover/focus polish across row/card/list surfaces.
- Improve loading/empty/error consistency where module-specific placeholders remain.
- Review reduced-motion coverage for animated controls.
- Improve scroll affordance copy/visual treatment for wide operational tables.
- Consider optional DataTable sticky header and skeleton rows if backward-compatible.

