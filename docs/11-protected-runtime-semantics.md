# Protected Runtime Semantics

Version: 2026-08-13

## Player Statuses

`WAITING`

- eligible to play
- primary suggestion pool

`PRIORITY`

- selected/prepared for an upcoming match or ready court
- not a permanent business status

`PLAYING`

- currently on court
- must not be suggested or used as replacement candidate

`RESTING`

- manually unavailable

`FINISHED`

- session completed/locked state for players

## Court Statuses

`EMPTY`

- no roster
- can accept suggestion

`READY`

- roster assigned
- can start
- can cancel before start

`PLAYING`

- active match
- can end
- routine roster mutation must be disabled

## Protected Transitions

- applying suggestion: players become prepared/priority and court becomes ready
- applying suggestion: remaining previews keep FIFO order and newly generated top-up previews are appended at the queue tail
- cancelling a ready court: the exact roster/team split returns to the front of the preview queue as a locked suggestion for operator adjustment
- starting match: court and players become playing
- ending match: real match counts increment, `lastFinishedAt` is recorded, players return to waiting immediately, and court becomes empty
- ending match: a post-match history record may be created for lookup
- completing session: players become finished, courts empty, runtime matches removed

## Anti-Duplicate Rule

Next-match suggestions must avoid duplicated players across suggestions and courts. Replacement from another suggestion must update that source suggestion.

## Eligibility Rule

Runtime scheduling controls are disabled unless:

- session is active
- session is not completed/cancelled
- at least four eligible players exist for the requested action/format

The player list may remain visible even when scheduling controls are disabled.

Auto-suggestion eligibility is stricter than the global player-count rule:

- player status must be `WAITING`
- `PLAYING`, `RESTING`, and `FINISHED` players are not eligible
- `Chưa tới` players are not eligible
- `Đã tới` is the attendance-positive state
- `Trận kế` is a one-shot request and does not independently override attendance or availability
- `End-Game` excludes a player; legacy `Chấn thương` and `Về sớm` normalize to `End-Game`
- `Host` should be avoided when at least four non-host eligible players exist

Mode-specific auto-suggestion requires:

- `Đôi Nam`: at least four eligible male players
- `Đôi Nữ`: at least four eligible female players
- `Nam nữ`: at least two eligible male and two eligible female players

If these requirements fail, the UI must show a direct operator-facing reason and must not commit an empty/meaningless runtime snapshot.

## Auto-Suggestion Scoring

Suggestion selection must preserve these ordered priorities:

- hard eligibility, format, no-duplicate, and Couple constraints
- team level balance is a quality gate stronger than request, Couple, late-arrival, and weak gender preferences
- wait protection and valid one-shot `Trận kế` requests
- limited late-arrival entry assistance without catch-up for matches before arrival
- adjusted match fairness and waiting duration
- female players use one-lower effective level when balancing against male players
- same-format matchups are preferred when level balance is acceptable
- Couple partners are fixed only in their registered format and independent in other formats
- only exact recent quartet repetition is avoided; do not penalize court or ordinary pair/opponent repetition
- `lastFinishedAt` is a soft tie-break only and cannot block consecutive manual scheduling
- `Host` is penalized unless needed to fill a match

Future changes to scoring weights must preserve operator override and must not make suggestions mandatory.

## Suggestion Validity

Before apply/start, runtime must revalidate that all four unique players are eligible, not on another court, not `End-Game`, and still satisfy the active Couple/format invariants. A kept/locked suggestion does not bypass these rules. Invalid suggestions become stale and must be repaired or regenerated.

## Session Lock Rule

When a session is completed or cancelled:

- runtime screen is readonly
- player/runtime editing must be disabled
- scheduling actions must be disabled
- the operator may still view historical state/details
