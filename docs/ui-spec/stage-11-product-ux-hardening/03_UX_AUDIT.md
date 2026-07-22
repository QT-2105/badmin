# Product UX Audit

Audit date: 2026-07-20

## Modules Audited

- App Shell
- Dashboard
- Schedule
- Session Workspace
- Runtime
- Finance
- Inventory
- Users and Permissions
- Settings

## Search Findings

### `window.confirm`

P1 unless used for runtime unsynced-leave protection.

- `src/components/inventory/inventory-page-client.tsx`: product deletion.
- `src/components/realtime-dashboard.tsx`: unsynced runtime leave confirmation.
- `src/components/schedule/schedule-page-client.tsx`: play-date deletion.
- `src/components/schedule/play-date-detail-client.tsx`: session deletion.

Notes:

- Runtime unsynced-leave confirmation is safety-sensitive and must not be replaced without preserving the leave guard exactly.
- Schedule and inventory deletion confirmations can be candidates for shared `Dialog` in a later sprint.

### Overflow And Scroll

Expected/intentional scroll exists in:

- App Shell mobile nav.
- Dashboard chart.
- Runtime stats/mode controls.
- Users table.
- Runtime player database panel.
- DataTable-like inventory/finance areas.

Risks:

- Horizontal scroll must remain container-local.
- No page-level horizontal overflow should be introduced.
- Wide operational tables should keep discoverable scroll affordance.

### Fixed / Sticky

Expected/intentional fixed/sticky exists in:

- App Shell desktop sidebar and mobile header.
- Runtime full-screen overlays.
- Runtime sticky header.
- Match History and Player Database full-screen panels.
- Data tables with sticky headers.
- Dialog and Drawer overlays.

Risks:

- Overlay z-index stacking.
- Focus return.
- Keyboard trapping.
- Mobile viewport height.
- Touch targets inside sticky regions.

### Icon-only Buttons

Most icon-only actions have `aria-label`, but they remain audit targets:

- Inventory edit/delete product buttons.
- Runtime match-history/player buttons.
- Runtime player database close buttons.
- Schedule inline edit/cancel/delete buttons.
- Dialog/Drawer close buttons.
- Theme and fullscreen toggles.

### Components Over 400 Lines

P1 decomposition candidates, presentation-only only:

- `src/components/inventory/inventory-page-client.tsx` — 862 lines.
- `src/components/schedule/session-detail-client.tsx` — 728 lines.
- `src/components/settings/settings-page-client.tsx` — 665 lines.
- `src/components/realtime-dashboard.tsx` — 633 lines.
- `src/components/users/auth-users-panel.tsx` — 623 lines.
- `src/components/finance/finance-page-client.tsx` — 412 lines.

No decomposition may change props, handlers, payloads, validation or data ownership.

## P0 Issues

- None confirmed from static audit.
- Potential P0 if later visual QA finds page-level horizontal overflow on tablet/mobile runtime or finance/inventory tables.
- Potential P0 if replacing `window.confirm` breaks destructive confirmation or runtime leave protection.

## P1 Issues

- `window.confirm` remains in Schedule and Inventory destructive actions.
- Product, finance, settings, runtime and user components are large enough to create maintenance risk.
- Some full-screen runtime overlays and shared overlays need a single focus/stacking review.
- Wide tables need consistent local scroll affordance and column readability.
- Container-local overflow is used inconsistently across modules.

## P2 Issues

- Hover/focus polish can be more consistent across rows/cards.
- Reduced-motion handling should be checked for all animated runtime and menu interactions.
- Empty/loading/error states can be more visually consistent where module-specific placeholders remain.

