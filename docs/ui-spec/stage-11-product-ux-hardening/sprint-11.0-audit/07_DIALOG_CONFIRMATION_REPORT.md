# Dialog And Confirmation Report

## Native Confirmation Calls

| File | Line | Purpose | Risk | Recommendation |
| --- | ---: | --- | --- | --- |
| `src/components/schedule/schedule-page-client.tsx` | 81 | Delete play date | P1 | Candidate for shared `Dialog`, preserving `deletePlayDate.mutate(id)` exactly. |
| `src/components/schedule/play-date-detail-client.tsx` | 124 | Delete session | P1 | Candidate for shared `Dialog`, preserving `deletePlaySession.mutate(id)` exactly. |
| `src/components/inventory/inventory-page-client.tsx` | 292 | Delete product | P1 | Candidate for shared `Dialog`, preserving `deleteProduct.mutate(product.id)` exactly. |
| `src/components/realtime-dashboard.tsx` | 98 | Unsynced runtime leave protection | P1 / Protected | Do not replace unless exact leave guard behavior and timing are preserved. |

## Existing Custom Dialog / Overlay Areas

- `src/components/ui/dialog.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/player/player-quick-view.tsx`
- `src/components/sections/match-history-panel.tsx`
- Runtime full-screen player list in `src/components/realtime-dashboard.tsx`
- Session completion confirmation in `src/components/schedule/session-detail-client.tsx`
- Settings destructive confirmation in `src/components/settings/settings-page-client.tsx`

## Stage 11 Requirements

- Confirmation UX must still require deliberate action.
- Destructive handlers and arguments must not change.
- Runtime leave guard must remain safety-first.
- Dialogs/drawers must have title, accessible name, focus handling and small viewport scroll.

