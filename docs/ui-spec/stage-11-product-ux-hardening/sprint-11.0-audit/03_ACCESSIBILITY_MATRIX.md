# Accessibility Matrix

| Module | Keyboard | Focus visible | ARIA labels | ARIA describedby | Role semantics | Dialog semantics | Status not color-only | Reduced motion | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| App Shell | Review | OK | OK | N/A | OK | N/A | OK | Review | P2 |
| Dashboard | Review | OK | OK | N/A | OK | N/A | OK | N/A | P2 |
| Schedule | Review | OK | OK | N/A | OK | Risk | OK | N/A | P1 |
| Session Workspace | Review | OK | OK | Review | Review | Review | OK | N/A | P1 |
| Runtime | Review | Review | OK | Review | OK | Review | OK | Review | P1 |
| Finance | Review | OK | OK | OK | OK | N/A | OK | N/A | P2 |
| Inventory | Review | OK | OK | OK | OK | Risk | OK | N/A | P1 |
| Users | Review | OK | OK | OK | OK | N/A | OK | Review | P1 |
| Settings | OK | OK | OK | OK | OK | OK | OK | OK | P2 |

## Positive Findings

- Many icon-only buttons already include `aria-label`.
- Users table uses explicit role semantics for table, row, columnheader and cell.
- Dialog and Drawer primitives expose dialog semantics, title and description association.
- Settings has `aria-expanded`, `aria-controls`, status feedback and reduced motion for section navigation.

## Accessibility Audit Targets

- Native `window.confirm` call sites should be reviewed for consistent accessible confirmation UX.
- Runtime full-screen panels need focus return and keyboard flow review.
- User permission matrix needs keyboard scan.
- Dense runtime controls need touch and focus target verification.
- Reduced motion should be checked for Framer Motion interactions.

