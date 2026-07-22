# Static Search Report

## Commands

```bash
rg -n "window\\.confirm|window\\.alert|confirm\\(|alert\\(" src
rg -n "overflow-x-auto|overflow-scroll|overflow-auto|w-screen|100vw|min-w-|fixed|sticky|tabIndex|aria-label|aria-describedby|role=" src
find src/components src/app -name '*.tsx' -print0 | xargs -0 wc -l | sort -nr | head -80
```

## Results

### `window.confirm`

Found 4 call sites:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`
- `src/components/inventory/inventory-page-client.tsx`
- `src/components/realtime-dashboard.tsx`

### `window.alert`

No direct `window.alert` call sites found.

### `overflow-x-auto` / `overflow-scroll` / `overflow-auto`

Found intentional table/panel overflow in:

- App Shell mobile nav.
- Runtime stats/mode/player panel.
- Users table.
- Dashboard chart.
- Shared drawer/dialog overlays via fixed/overflow primitives.

### `w-screen` / `100vw`

No source hits found.

### `min-w-`

Common across layout, truncation and wide operational table surfaces.

Important review targets:

- Dashboard page min width.
- Users table min width.
- Runtime mode/stat controls.
- Player database panel columns.

### `fixed` / `sticky`

Expected in:

- App Shell sidebar/mobile header.
- Runtime and history overlays.
- Dialog/Drawer.
- Table sticky headers.

### `tabIndex`

Found in:

- Session player quick-view row button emulation.
- Shared Dialog.
- Shared Drawer.

### `aria-label`, `aria-describedby`, `role=`

Broadly present across the app. Stage 11 should verify quality and keyboard behavior rather than adding labels blindly.

### Icon-only buttons

Static scan shows most icon-only buttons include `aria-label`, especially:

- Inventory edit/delete.
- Schedule inline edit/cancel.
- Runtime player/history actions.
- Dialog/Drawer close.
- Theme/fullscreen toggles.

Touch size remains the bigger risk than naming.

