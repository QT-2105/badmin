# Zustand Runtime Rules

Version: 2026-06-09

## Store Role

`src/lib/badminton-store.ts` owns live runtime responsiveness.

It is protected because it implements:

- court generation from `court_count`
- player lifecycle transitions
- next-match generation
- suggestion replacement
- ready-court cancellation
- match start/end
- cooldown updates
- runtime hydration mapping
- sync payload source state

## Optimistic Rule

Operator actions update Zustand immediately.

Database sync is a persistence step after the action. The UI must not wait for a DB write before showing the operator's action.

## DB Call Rule

Avoid realtime DB select/write loops. Runtime should call the database when:

- entering/hydrating a runtime
- clicking an important runtime action that commits a snapshot
- saving player edits
- starting/completing sessions
- creating finance/inventory records

Do not persist on every render or every temporary selection.

## Protected Actions

Treat these actions as semantic runtime behavior:

- `hydrateRuntimeSnapshot`
- `refreshNextMatches`
- `applyNextMatch`
- `replaceNextMatchPlayer`
- `cancelReadyCourt`
- `replaceSlot`
- `swapPairs`
- `startMatch`
- `endMatch`
- `updateCooldowns`
- `updatePlayer`
- `updatePlayerPayment`

Changing their lifecycle effects requires owner approval unless the owner directly requested the behavior change.

## Hardcoded Data Rule

The store must not contain seed players or permanent hardcoded runtime data. Empty runtime state is valid. Runtime data should come from session players, session metadata, and current DB snapshot.
