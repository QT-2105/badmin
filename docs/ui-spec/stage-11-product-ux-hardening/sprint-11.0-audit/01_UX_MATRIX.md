# UX Matrix

Audit date: 2026-07-20

Legend:

- OK: acceptable baseline from static audit.
- Review: needs browser/device verification or consistency pass.
- Risk: likely Stage 11 implementation target.
- N/A: not part of the module.

| Module | Layout | Header | Toolbar | KPI | Card | Table | Form | Dialog | Drawer | Loading / Empty / Error | Responsive | Keyboard / Focus / ARIA | Light / Dark | Touch | Permission presentation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| App Shell | OK | OK | OK | N/A | N/A | N/A | N/A | N/A | N/A | Review | Review | Review | OK | Review | OK |
| Dashboard | OK | OK | N/A | OK | OK | OK | N/A | N/A | N/A | Review | Review | OK | Review | OK | N/A |
| Schedule | OK | OK | OK | N/A | OK | N/A | OK | Risk | N/A | Review | Review | OK | OK | Review | OK |
| Session Workspace | Review | OK | OK | OK | OK | N/A | Review | Review | N/A | Review | Review | Review | Review | Review | OK |
| Runtime | Review | OK | Review | OK | Review | Review | Review | Risk | N/A | Review | Risk | Review | Review | Risk | OK |
| Finance | OK | OK | OK | OK | N/A | OK | Review | N/A | N/A | Review | Review | OK | Review | Review | OK |
| Inventory | Review | OK | OK | OK | OK | OK | Review | Risk | N/A | Review | Review | OK | Review | Review | OK |
| Users | Review | OK | OK | N/A | OK | Review | Review | N/A | N/A | Review | Review | Review | OK | Review | Risk |
| Settings | OK | OK | OK | N/A | OK | N/A | OK | OK | N/A | OK | OK | OK | OK | OK | OK |

## Module Notes

### App Shell

- Desktop fixed sidebar and mobile sticky header are intentional.
- Mobile nav uses horizontal overflow; confirm container-local behavior.
- Collapsed nav control has accessible label.

### Dashboard

- KPI and recent sessions have shared component adoption.
- Chart uses wide content inside the page shell; verify no global overflow.
- Loading/empty/error states remain a consistency target.

### Schedule

- Current destructive actions still use native confirmation.
- Day/session cards are readable but require mobile touch audit.
- Route and CRUD behavior must remain unchanged.

### Session Workspace

- Player list and inline edit density are high.
- Completion dialog exists and must preserve completion semantics.
- Component size suggests presentation-only decomposition is useful later.

### Runtime

- Highest risk module because tablet runtime is primary product surface.
- Dense controls are intentional but require touch and keyboard verification.
- Runtime leave confirmation is safety-sensitive.

### Finance

- Table and form are compact and operational.
- No calculation or payload change is allowed.
- Transaction table scroll and mobile readability need QA.

### Inventory

- Highest non-runtime table/form risk.
- Product delete still uses native confirmation.
- Product and movement tables need overflow and touch scan.

### Users

- Wide table and permission matrix intentionally use internal scroll.
- Permission presentation must not imply client UI is security.
- Role/status values and server authorization are protected.

### Settings

- Recently hardened in Stage 10.
- Missing capabilities must stay hidden/future-scope.
- No fake settings controls should be introduced in Stage 11.

