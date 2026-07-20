# Current Audit

Status: Complete for Sprint 6.0 baseline.

This sprint audited the current runtime presentation layer without changing source code. The detailed stage-level audit remains in `../03_CURRENT_RUNTIME_AUDIT.md`; this file records the sprint-specific component baseline and safety findings.

## Runtime Component Baseline

| Area | Current file | Presentation role | Protected coupling |
| --- | --- | --- | --- |
| Runtime frame | `src/components/realtime-dashboard.tsx` | Full-screen runtime shell, top bar, stats, notices, court/suggestion split, player/history overlays | Calls hydration/sync hooks, store runtime actions, match-history mutation, snapshot commit |
| Court grid | `src/components/sections/live-courts-section.tsx` | Renders all generated courts and delegates each court card | Reads `courts` from Zustand store |
| Court card | `src/components/cards/court-card.tsx` | Shows court status, teams, timer, court actions | Calls `swapPairs`, `startMatch`, `endMatch`, `applyNextMatch`, `cancelReadyCourt`; builds match-history payload |
| Next match queue | `src/components/sections/next-match-queue.tsx` | Renders suggestions and auto-assign control | Reads `nextMatches`/`courts`; calls `refreshNextMatches`, `applyNextMatch` |
| Next match card | `src/components/cards/next-match-card.tsx` | Shows suggested pairs, lock/apply/replace UI, replacement selector | Calls `applyNextMatch`, `replaceNextMatchPlayer`, `toggleNextMatchLock`; owns replacement draft UI state |
| Player list | `src/components/sections/player-database-panel.tsx` | Runtime player review/edit/payment/tag panel | Calls `updatePlayer`, `updatePlayerPayment`, `useSessionPlayerMutations`; explicit save to DB |
| Match history | `src/components/sections/match-history-panel.tsx` | Read-only match-history overlay and player filter | Reads `useMatchHistory`; must not become live runtime source of truth |
| Team display | `src/components/cards/player-team.tsx` | Player identity display inside court teams | Presentation-only, but must preserve displayed player order |

## Presentation Issues Found

- Runtime uses many raw `slate`/`cyan`/`emerald`/`rose` utility classes rather than Stage 01 semantic tokens.
- Dark-mode assumptions are embedded in full-screen runtime containers; light-mode parity is not guaranteed.
- Button styling is repeatedly implemented with custom `motion.button` classes instead of shared primitives.
- Focus-visible styling is inconsistent across court actions, suggestion actions, select controls, and overlay close buttons.
- Disabled states rely mostly on opacity; contrast and affordance can be weak on tablets.
- Nested scroll regions exist in runtime shell, court grid, suggestion queue, player list, and history overlay; bounded scrolling must be preserved but visually refined.
- Compact touch targets exist in suggestion lock/apply/replace actions and court swap buttons; later sprints may adjust only size/spacing without changing handlers.
- Player name wrapping/truncation remains inconsistent across courts, suggestions, and waiting/player lists.

## Protected Handler And Data Contracts

The following contracts must remain unchanged in later Stage 06 implementation sprints:

- Existing store actions must be called with the same arguments and timing.
- `commitRuntimeSnapshot()` must remain an explicit operator-action commit.
- `buildMatchHistoryPayload()` output shape and invocation timing must remain unchanged.
- `replacementPlayers` eligibility and ordering must not be modified.
- `refreshSuggestions()` and suggestion mode behavior must not be rewritten.
- Player status, court status, match status, and queue status labels may be styled, but not remapped.
- Runtime overlays may be visually refined, but their data source, filters, and route behavior must not change.

## Scope Audit Matrix

| Scope item | Status | Findings |
| --- | --- | --- |
| Runtime route | Audited | `SessionRuntimePage` uses `requirePageUser` then renders `RuntimeRouteClient`; route and guard are protected. |
| Runtime page | Audited | `RuntimeRouteClient` sets localStorage and store session id before rendering dashboard; timing is protected. |
| Realtime dashboard | Audited | Owns layout, status gating, hydration/sync display, auto-match notice, overlays; high handler coupling. |
| Runtime header | Audited | Sticky dark header with dashboard/session escape; `onLeave` confirmation must remain. |
| Runtime toolbar | Audited | History/player buttons, suggestion mode, auto-match trigger; compact and dark-only. |
| Runtime summary | Audited | Local `StatPill`; density is good but token usage is inconsistent. |
| Court grid | Audited | `LiveCourtsSection` renders all courts from store; must preserve order and all-court visibility. |
| Court card | Audited | Core court actions are directly wired; presentation refactor must not alter status gates or action order. |
| Waiting queue | Audited | `PlayerStatusOverview` is collapsed by default and uses existing player data/sort. |
| Next match | Audited | `NextMatchQueue` and `NextMatchCard` use protected match state/actions. |
| Match history | Audited | Read-only overlay with player filter; not live runtime source. |
| Player database/list panel | Audited | Runtime fullscreen panel edits players and persists only on explicit save. |
| Light mode | P0 | Runtime is dark hard-coded; not light-theme compliant. |
| Dark mode | P1 | Usable but not aligned to shared semantic tokens. |
| Desktop | P1 | Layout works but relies on nested scroll and local surfaces. |
| Tablet landscape | P0/P1 | Primary target; touch size/focus needs stricter QA. |
| Tablet portrait | P0 | Nested height/scroll can hide actions. |
| Mobile smoke | P0 | Bottom next-match panel plus queue scroll can constrain access. |
| Keyboard | P0/P1 | Native controls exist; custom buttons need standardized focus-visible. |
| Focus | P0 | Inconsistent focus treatment across custom controls. |
| Contrast | P0/P1 | Disabled opacity and tag tones need verification. |
| Overflow | P0/P1 | Multiple nested scroll regions need containment QA. |
| Hard-coded color | P1 | Extensive raw Tailwind color classes. |
| Hard-coded spacing | P1 | Many local spacing/height utilities outside shared layout primitives. |
| Hard-coded radius | P1 | Repeated local radii rather than shared surface primitives. |
| Hard-coded shadow | P2 | Local shadows mostly on small controls. |
| Shared component usage | P1 | Uses some primitives; many surfaces/buttons/badges remain local. |
| Runtime dependencies | P0 | Store/hook/mutation coupling is high and must remain unchanged. |

## Risk Classification

- P0: any source edit that changes a handler call, store selector, status condition, or persistence timing.
- P1: replacing raw classes with tokens in high-coupling components while accidentally changing disabled/visibility conditions.
- P2: typography, spacing, radius, and icon alignment polish that can be performed safely after P0/P1 checks.
