# Touch Target Report

Target: approximately 40px minimum for touch actions.

## Static Findings

Likely acceptable:

- Many primary action buttons use `h-10`, `h-11`, or `h-12`.
- Inventory edit/delete product buttons use `h-10`.
- Schedule player row actions use `h-10`.
- Runtime important court actions generally use large card/action areas.

Needs review:

- `h-8` compact runtime buttons in `src/components/realtime-dashboard.tsx`.
- `h-9 w-9` quick-view/dialog close-style buttons.
- `h-9` pagination controls.
- Dense icon-only runtime and table controls.
- Player fee dropdown options.

## Module Risk

| Module | Touch risk | Notes |
| --- | --- | --- |
| App Shell | P2 | Collapsed sidebar/mobile nav touch scan needed. |
| Dashboard | P2 | Mostly links/buttons, low risk. |
| Schedule | P1 | Card actions and destructive controls. |
| Session Workspace | P1 | Inline player edit actions and avatar controls. |
| Runtime | P1 | Dense tablet controls and small history/player buttons. |
| Finance | P2 | Form and table controls mostly acceptable. |
| Inventory | P1 | Product table actions and form tabs. |
| Users | P1 | Dense table save/password/permission controls. |
| Settings | P2 | Mostly acceptable after Stage 10. |

## Acceptance Criteria

- Critical runtime actions must not be below practical touch size.
- Icon-only actions must have labels and visible focus.
- Dense controls must remain reachable without accidental neighboring taps.

