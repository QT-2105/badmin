# Protected Runtime Semantics

Version: 2026-06-09

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

`JUST_FINISHED`

- recently ended a match
- protected cooldown/fairness state
- may return to `WAITING` through cooldown logic

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
- starting match: court and players become playing
- ending match: players become just-finished, matches increment, court becomes empty
- ending match: a post-match history record may be created for lookup
- completing session: players become finished, courts empty, runtime matches removed

## Anti-Duplicate Rule

Next-match suggestions must avoid duplicated players across suggestions and courts. Replacement from another suggestion must update that source suggestion.

## Eligibility Rule

Runtime scheduling controls are disabled unless:

- session is active
- session is not completed/cancelled
- player count is at least `court_count * 6`

The player list may remain visible even when scheduling controls are disabled.

## Session Lock Rule

When a session is completed or cancelled:

- runtime screen is readonly
- player/runtime editing must be disabled
- scheduling actions must be disabled
- the operator may still view historical state/details
