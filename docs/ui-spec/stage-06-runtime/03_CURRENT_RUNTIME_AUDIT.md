# Current Runtime Audit

Status: Sprint 6.0 baseline audit completed

Source code changed: No

## Files Read

- `src/app/sessions/[sessionId]/runtime/page.tsx`
- `src/components/runtime-route-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/sections/match-history-panel.tsx`
- `src/components/cards/player-team.tsx`

## Runtime Route

`/sessions/[sessionId]/runtime` is the only runtime route.

The route:

- reads `sessionId` from route params;
- calls `requirePageUser('/sessions/[sessionId]/runtime')`;
- renders `RuntimeRouteClient`.

Protected route contract:

- do not rename the route;
- do not change permission guard behavior;
- do not change route params;
- do not redirect runtime into root navigation;
- do not move runtime under Dashboard or Schedule root nav.

## Runtime Page

`RuntimeRouteClient` is the page-level runtime bridge.

Current responsibilities:

- write `badmin_active_session_id` to localStorage;
- call `setRuntimeSessionId(sessionId)`;
- render `RealtimeDashboard`.

Protected page contract:

- keep `sessionId` source unchanged;
- keep `setRuntimeSessionId` timing unchanged;
- keep localStorage recovery key unchanged;
- do not add fetch/mutation behavior here.

## Realtime Dashboard

Runtime UI is a client-side operational surface driven primarily by `useBadmintonStore`.

`RealtimeDashboard` owns:

- runtime full-screen frame;
- session status checks;
- hydration/sync state display;
- runtime leave warning;
- auto-match trigger guard;
- match history overlay state;
- player fullscreen overlay state;
- desktop/tablet split layout;
- mobile stacked layout;
- composition of court grid, waiting/player overview, next-match queue, and overlays.

Protected dashboard contract:

- keep `refreshSuggestions` behavior unchanged;
- keep `getAutoMatchBlockReason` behavior unchanged;
- keep `commitRuntimeSnapshot` only on meaningful operator actions;
- keep scheduling disabled logic unchanged;
- keep `beforeunload` warning semantics unchanged.

## Runtime Header

`RuntimeTopBar` is a local component inside `RealtimeDashboard`.

Current responsibilities:

- dashboard escape action;
- fullscreen toggle;
- centered session title/time/status/sync label;
- link back to session detail.

P0 risk:

- header is sticky and compact, but raw dark classes make light-mode parity unsafe.
- escape links must keep `onLeave` confirmation behavior.

## Runtime Toolbar

Toolbar behavior is split across:

- desktop/tablet header stats and buttons;
- `SuggestionModePicker`;
- `Auto xếp cặp` trigger;
- history/player overlay buttons;
- mobile bottom next-match control.

Protected toolbar contract:

- mode options must remain `random`, `mixed`, `women`, `men`;
- auto-pair button must continue to call the current `refreshSuggestions`;
- disabled state must continue to use current scheduling and block-reason logic.

## Runtime Summary

Current summary uses `StatPill` for:

- total players;
- waiting;
- just finished;
- playing.

P1 risk:

- summary cards use local tone logic and raw classes.
- typography is compact and operationally useful; visual refactor must preserve density.

## Court Grid

`LiveCourtsSection` reads generated courts from Zustand and renders every court through `CourtCard`.

Protected grid contract:

- do not filter out empty courts;
- do not change court order;
- do not change the `CourtCard` props contract;
- do not change generated court source.

## Court Card

`CourtCard` owns only local elapsed-time display state and calls existing store actions for court operations.

Current actions:

- `applyNextMatch(nextMatches[0].id, court.id)`;
- `cancelReadyCourt(court.id)`;
- `swapPairs(court.id)`;
- `startMatch(court.id)`;
- `endMatch(court.id)`;
- `onCommitRuntime?.()`;
- `onRecordMatch?.(historyPayload)`.

Protected card contract:

- do not change action order;
- do not change `buildMatchHistoryPayload`;
- do not change status gates for EMPTY/READY/PLAYING;
- do not change team slicing from slots.

## Waiting Queue / Player Overview

Runtime waiting overview is currently `PlayerStatusOverview` inside `RealtimeDashboard`.

Current behavior:

- collapsed by default;
- uses player tags summary;
- expanded list sorts by existing local status-rank, match count, then name;
- displays waiting/just-finished/playing/priority/resting/finished status labels.

Protected waiting contract:

- do not change queue source;
- do not change queue sorting;
- do not remap player statuses;
- do not change tag meaning.

## Next Match

`NextMatchQueue` renders `nextMatches` and delegates each card to `NextMatchCard`.

`NextMatchCard` owns local replacement draft UI state and persists only through existing actions.

Current actions:

- `toggleNextMatchLock(match.id)`;
- `applyNextMatch(match.id, targetCourt?.id)`;
- `replaceNextMatchPlayer(match.id, slotIndex, playerId)`;
- `onCommitRuntime?.()`.

Protected next-match contract:

- do not change next-match state source;
- do not change replacement eligibility filter/sort;
- do not change lock/apply/replace semantics;
- do not change target empty-court selection.

## Match History

`MatchHistoryPanel` is read-only display/filter UI using `useMatchHistory(sessionId, selectedPlayerId || null)`.

Protected history contract:

- match history must not become live runtime source of truth;
- do not change query hook or filter payload;
- do not change creation timing in `CourtCard`/`RealtimeDashboard`.

## Player Database/List Panel

`PlayerDatabasePanel` is available in Runtime fullscreen overlay.

Current behavior:

- edits player info/payment/tag data optimistically in Zustand;
- marks dirty player ids;
- persists only when operator clicks save;
- respects readonly mode.

Protected player-panel contract:

- do not auto-save on render/change;
- do not change payment mapping;
- do not change dirty tracking;
- do not change `useSessionPlayerMutations` payload shape.

## Light Mode

P0 issue:

- Runtime is currently dark-first/full-screen (`bg-slate-950`, `text-slate-100`, `bg-slate-*`, `border-white/10`).
- It will not inherit light-mode tokens cleanly without targeted presentation migration.

Allowed future work:

- replace raw colors with semantic runtime tokens if no handler/data changes are required.

## Dark Mode

Current dark mode is operationally usable and dense.

P1 issue:

- colors are visually functional but not fully aligned with Stage 01/02 semantic token system.

## Desktop

Current desktop layout:

- sticky top bar;
- compact stats row;
- two-column runtime area;
- left court/waiting column;
- right next-match column.

P1 issue:

- court column and suggestion column use nested scroll and mixed local surfaces.

## Tablet Landscape

Primary target.

P0/P1 risks:

- compact controls are useful but several touch targets are near the minimum.
- next-match replacement UI can become dense and must be tested without changing selection behavior.

## Tablet Portrait

P0 risk:

- fixed height, nested scroll, and mobile bottom panel can hide important actions if viewport height is constrained.

## Mobile Smoke Behavior

Current mobile behavior:

- stats horizontal scroll;
- court list scroll;
- next-match panel anchored at bottom;
- history/player overlays fullscreen.

P0 risk:

- bottom next-match panel plus nested queue scroll can cause inaccessible content on small screens.

## Keyboard

P0/P1 risks:

- many controls are buttons/selects and are keyboard reachable.
- focus-visible styling is inconsistent or missing on custom motion buttons.
- some icon-only controls rely on visual/title affordance rather than robust accessible labels.

## Focus

P0 issue:

- focus rings are not standardized across runtime controls.
- future presentation work should add tokenized `focus-visible` without changing handlers.

## Contrast

P0/P1 issues:

- disabled controls often use opacity only.
- tag/status colors on dark surfaces may pass visually but need manual contrast QA.
- light-mode contrast is not guaranteed because runtime is dark hard-coded.

## Overflow

P0/P1 issues:

- court cards, next-match replacement panels, player table, and history overlay all use nested overflow.
- future work must preserve bounded scroll while improving visibility of critical actions.

## Hard-Coded Style Findings

- Color: extensive raw `slate`, `cyan`, `emerald`, `rose`, `violet`, `amber`, `white/[...]`.
- Spacing: many local `px-*`, `py-*`, `gap-*`, `max-h-*`, `min-h-*`, `h-screen`, `max-h-[46vh]`.
- Radius: repeated `rounded-lg`, `rounded-xl`, `rounded-2xl`.
- Shadow: local shadows in court swap/action controls.
- Border: repeated `border-white/10`, `border-slate-*`, `border-cyan-*`.

## Shared Component Usage

Currently used:

- `Button`;
- `FullscreenToggle`;
- `PlayerAvatar`;
- `PlayerFeeInput`;
- `PlayerQuickView`;
- `PlayerTagBadges`.

Not broadly adopted:

- `Surface`;
- `StatusBadge`;
- `LoadingState`;
- `EmptyState`;
- `DataTable`;
- `Dialog`;
- `Drawer`;
- `ActionMenu`.

Runtime adoption must be selective because overlay/table/drawer replacements can alter scroll, focus, or workflow.

## Runtime Dependencies

State dependencies:

- `useBadmintonStore`;
- `useRuntimeHydration`;
- `useRuntimeSync`;
- `usePlaySession`;
- `useMatchHistory`;
- `useMatchHistoryMutations`;
- `useSessionPlayerMutations`.

Formatting/label dependencies:

- `getSessionStatusLabel`;
- `normalizeSessionStatus`;
- `isRuntimeActiveStatus`;
- `isRuntimeReadonlyStatus`;
- `getDisplayPlayerName`;
- `getLevelLabel`;
- `PLAYER_TAG_OPTIONS`;
- `normalizePlayerTags`;
- `togglePlayerTag`.

## P0 Findings

- Theme: Runtime is hard-coded dark and not light-mode safe.
- Layout: nested scroll regions can make tablet portrait/mobile actions inaccessible.
- Button usability: compact action buttons and icon-only buttons need stronger focus/label/touch treatment.
- Focus: custom motion buttons lack standardized focus-visible styles.
- Contrast: disabled states rely heavily on opacity and may be unclear.

## P1 Findings

- Hierarchy: runtime header, court area, next-match cards, and player list have inconsistent section hierarchy.
- Typography: uppercase labels, small labels, and local headings are not fully standardized.
- Spacing/density: density is appropriate but not tokenized; later work must preserve compactness.
- Shared component adoption: local surfaces/buttons/badges repeat styles.

## P2 Findings

- Hover states are inconsistent but secondary for touch-first runtime.
- Motion is present and should remain subtle; no functional motion changes needed.
- Emoji score labels are polish candidates only.

## Safe Migration Candidates

- Add accessible labels to existing buttons.
- Replace raw classes with semantic tokens where no layout or handler changes are needed.
- Normalize border/radius/shadow on containers.
- Improve player name truncation/wrapping.
- Improve tablet scroll containment.
- Convert presentational wrappers to shared `Surface` only if props/handlers remain unchanged.

## High-Risk Areas

- `refreshSuggestions`
- `getAutoMatchBlockReason`
- `applyNextMatch`
- `replaceNextMatchPlayer`
- `toggleNextMatchLock`
- `swapPairs`
- `cancelReadyCourt`
- `startMatch`
- `endMatch`
- `buildMatchHistoryPayload`
- `updatePlayer`
- `updatePlayerPayment`
- `persistPlayer.mutateAsync`
- `createHistory.mutateAsync`
- `commitRuntimeSnapshot`
- `useRuntimeHydration`
- `useRuntimeSync`
- `useMatchHistory`

These must not be changed in Stage 06 unless explicitly approved.
