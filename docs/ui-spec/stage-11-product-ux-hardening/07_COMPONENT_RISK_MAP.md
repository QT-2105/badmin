# Component Risk Map

## High Risk

| Component | Risk | Stage 11 stance |
| --- | --- | --- |
| `src/components/realtime-dashboard.tsx` | Runtime status, leave protection and live controls are behavior-sensitive. | Presentation-only changes after focused sprint plan. |
| `src/components/cards/court-card.tsx` | Start/end/cancel/apply actions are behavior-sensitive. | Presentation-only; no handler or condition changes. |
| `src/components/cards/next-match-card.tsx` | Replacement and apply behavior are protected. | Presentation-only; no suggestion data changes. |
| `src/components/sections/player-database-panel.tsx` | Runtime player/payment edit behavior. | Presentation-only; no sorting/filtering changes. |
| `src/components/schedule/session-detail-client.tsx` | Session start/completion/player CRUD. | Presentation decomposition only if props and handlers are preserved. |

## Medium Risk

| Component | Risk | Stage 11 stance |
| --- | --- | --- |
| `src/components/inventory/inventory-page-client.tsx` | Forms and stock movements are calculation-sensitive. | Presentation-only; confirm replacement must preserve delete handler. |
| `src/components/finance/finance-page-client.tsx` | Manual transaction payload and totals are protected. | Presentation-only; no field or formula changes. |
| `src/components/users/auth-users-panel.tsx` | Roles, permissions and status transitions are security-sensitive. | Presentation-only; no visibility/security changes. |
| `src/components/settings/settings-page-client.tsx` | Settings and destructive actions. | Presentation-only; no setting/persistence changes. |

## Lower Risk

| Component | Risk | Stage 11 stance |
| --- | --- | --- |
| `src/components/ui/button.tsx` | Shared primitive affects whole app. | Optional presentation props only, with full validation. |
| `src/components/ui/data-table.tsx` | Shared table primitive affects Dashboard pilot and future lists. | Optional presentation props only. |
| `src/components/ui/dialog.tsx` | Overlay/focus affects confirmations. | Focus/scroll/stacking hardening only. |
| `src/components/ui/drawer.tsx` | Overlay/focus affects mobile/tablet UX. | Focus/scroll/stacking hardening only. |
| `src/components/app-shell.tsx` | Navigation and route visibility. | Presentation-only; root nav unchanged. |

