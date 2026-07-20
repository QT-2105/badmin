# Runtime Settings Implementation Plan

Status: NOT APPLICABLE

## Preconditions

Runtime Settings UI can only be implemented for existing presentation preferences with existing config keys, persistence, handlers, and runtime-safe behavior. The current source does not provide such Settings capabilities.

## Setting Matrix

| Setting | Current source | Used by | Default | Validation | Persistence | Handler | Required preservation |
|---|---|---|---|---|---|---|---|
| Animation | None | None | Not applicable | None | None | None | MISSING; do not implement. |
| Compact court cards | Runtime presentation only | Runtime UI | Existing code behavior | Existing code behavior | None | None | MISSING as setting; do not implement. |
| Queue density | Runtime presentation only | Runtime UI | Existing code behavior | Existing code behavior | None | None | MISSING as setting; do not implement. |
| Sound | None | None | Not applicable | None | None | None | MISSING; do not implement. |
| Auto-scroll | None | None | Not applicable | None | None | None | MISSING; do not implement. |
| Display preferences | Theme/fullscreen controls outside Settings | App shell/runtime controls | Existing control behavior | Existing control behavior | Existing local/browser behavior | Existing controls | PARTIAL but not runtime-specific Settings; do not create new panel. |
| Queue priority | `src/lib/badminton-store.ts` | Runtime scheduling | Existing algorithm | Protected | Runtime state/store | Protected actions | READ_ONLY/PROTECTED; do not implement. |
| Pairing algorithm | `src/lib/badminton-store.ts` | Auto pairing | Existing algorithm | Protected | Runtime state/store | Protected actions | READ_ONLY/PROTECTED; do not implement. |
| Rest/status flow | Runtime lifecycle | Player runtime status | Existing lifecycle | Protected | Runtime state/store | Protected actions | READ_ONLY/PROTECTED; do not implement. |
| Court assignment | Runtime store/actions | Runtime courts | Existing behavior | Protected | Runtime state/store/API | Protected actions | READ_ONLY/PROTECTED; do not implement. |
| Match generation | Runtime store/actions | Next match | Existing behavior | Protected | Runtime state/store | Protected actions | READ_ONLY/PROTECTED; do not implement. |

## Implementation Decision

- Do not modify source code.
- Do not add Runtime Settings navigation item.
- Do not add toggles for auto pairing, queue priority, rest duration, court assignment, or match generation.
- Document missing presentation preference capabilities as Future Scope.

## Protected Files

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- Runtime hooks, services, repositories, API, routes, and synchronization logic.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
