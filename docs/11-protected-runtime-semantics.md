# Protected Runtime Semantics

Version: 2026-06-30

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

Auto-suggestion eligibility is stricter than the global player-count rule:

- player status must be `WAITING` or `JUST_FINISHED`
- `PLAYING`, `RESTING`, and `FINISHED` players are not eligible
- `Chưa tới` players are not eligible unless marked `Ưu tiên` or `Host`
- `Đã tới`, `Ưu tiên`, and `Host` are attendance-positive tags
- `Chấn thương` and `Về sớm` exclude a player from auto-suggestion
- `Host` should be avoided when at least four non-host eligible players exist

Mode-specific auto-suggestion requires:

- `Đôi Nam`: at least four eligible male players
- `Đôi Nữ`: at least four eligible female players
- `Nam nữ`: at least two eligible male and two eligible female players

If these requirements fail, the UI must show a direct operator-facing reason and must not commit an empty/meaningless runtime snapshot.

## Auto-Suggestion Scoring

Current scoring must preserve these priorities:

- fairness by match count remains important
- team level balance is stronger than weak gender-format preference
- female players use one-lower effective level when balancing against male players
- same-format matchups are preferred when level balance is acceptable
- recent pair and roster repetition are penalized to keep future matches fresh
- `Host` is penalized unless needed to fill a match
- `Ưu tiên` is boosted

Future changes to scoring weights must preserve operator override and must not make suggestions mandatory.

## Session Lock Rule

When a session is completed or cancelled:

- runtime screen is readonly
- player/runtime editing must be disabled
- scheduling actions must be disabled
- the operator may still view historical state/details
