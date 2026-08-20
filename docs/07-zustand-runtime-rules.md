# Zustand Runtime Rules

Version: 2026-08-13

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
- arrival/waiting/request/last-finished fairness metadata
- Couple groups derived directly from `session_players.couple_number` and `couple_match_mode`
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
- `updatePlayer`
- `updatePlayerPayment`

Changing their lifecycle effects requires owner approval unless the owner directly requested the behavior change.

## Auto-Suggestion Guardrails

The store may score and rank suggestions, but the UI owns operator-facing validation before committing a snapshot.

Current target auto-suggestion behavior:

- players must be `WAITING`; ending a match returns them to `WAITING` immediately
- `PLAYING` players are excluded
- `Chưa tới` and `End-Game` must not enter normal auto-suggestion
- legacy `Chấn thương` and `Về sớm` normalize to `End-Game`
- `Trận kế` is a one-shot request consumed when the match starts, not a permanent scoring tag
- late-arrival assistance is limited; wait protection prevents compatible earlier arrivals from being skipped repeatedly
- Couple constraints apply only in the Couple's registered format
- selecting `Host` also marks `Đã tới`, but `Host` is excluded from automatic wait/catch-up/request priority and is considered only when it increases valid batch cardinality; manual placement remains allowed
- female players use one-lower effective level for balancing
- same-format matchups are preferred when level balance is acceptable
- only exact-quartet repetition is avoided; ordinary pair/opponent and court repetition are not penalized

Suggestion generation must remain a pure local computation over the hydrated Zustand snapshot. It must not query or write the database while enumerating candidates, previewing replacements, changing modes, or explaining a blocked result.

Lock is an Auto boundary, not an operator-edit boundary. Cross-Lock manual swaps are valid, must preserve all Lock flags, must update every affected preview atomically, and must validate the complete resulting queue before persistence.

## Hardcoded Data Rule

The store must not contain seed players or permanent hardcoded runtime data. Empty runtime state is valid. Runtime data should come from session players, session metadata, and current DB snapshot.
