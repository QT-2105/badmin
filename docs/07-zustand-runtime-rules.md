# Zustand Runtime Rules

Version: 2026-06-30

## Store Role

`src/lib/badminton-store.ts` owns live runtime responsiveness.

It is protected because it implements:

- court generation from `court_count`
- player lifecycle transitions
- next-match generation
- attendance/player tag eligibility for auto-suggestions
- effective-level scoring for gender-aware balancing
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

If an auto-suggestion action is blocked because no eligible players are available, attendance tags are missing, or the selected gender mode cannot be satisfied, the UI must show the reason and must not call `commitRuntimeSnapshot`.

`refreshNextMatches` may update Zustand only after preconditions pass. Persisting an empty or invalid suggestion set is treated as an unnecessary runtime DB write.

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

## Auto-Suggestion Guardrails

The store may score and rank suggestions, but the UI owns operator-facing validation before committing a snapshot.

Current auto-suggestion behavior:

- players must be `WAITING` or `JUST_FINISHED`
- `PLAYING` players are excluded
- `Chưa tới`, `Chấn thương`, and `Về sớm` must not enter normal auto-suggestion
- `Ưu tiên` boosts a player into earlier suggestions
- `Host` is avoided when four non-host eligible players exist
- female players use one-lower effective level for balancing
- same-format matchups are preferred when level balance is acceptable
- recent partner/opponent repetition is penalized

## Hardcoded Data Rule

The store must not contain seed players or permanent hardcoded runtime data. Empty runtime state is valid. Runtime data should come from session players, session metadata, and current DB snapshot.
