# Scheduling Engine Constitution

Version: 2026-06-09

## Protected Lifecycle

The protected player flow is:

`WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING`

Current implementation details:

- `NEXT_MATCH` is represented by `nextMatches`
- players in a prepared suggestion/court can be marked `PRIORITY`
- `PLAYING` players cannot be selected as replacements
- `JUST_FINISHED` players may be considered for replacement/suggestion with cooldown/fairness penalties

## Court Lifecycle

Court statuses:

- `EMPTY`: can receive a suggestion
- `READY`: has roster, not started
- `PLAYING`: running match

Allowed flow:

`EMPTY -> READY -> PLAYING -> EMPTY`

Ready courts may be cancelled before start. Cancelling returns rostered players to `WAITING` and refreshes suggestions.

## Current Court Model

Courts are generated from `play_sessions.court_count` and identified in runtime by fixed ids/names such as `c1`, `Sân 1`, and persisted by `court_number`.

Do not reintroduce a required court catalog unless the owner explicitly asks for physical court management.

## Suggestion Heuristics

The suggestion engine prioritizes:

- players with fewer matches
- team level balance
- same-format matchups:
  - nam-nam vs nam-nam
  - nữ-nữ vs nữ-nữ
  - nam-nữ vs nam-nữ
- new combinations through a small novelty nudge
- anti-repeat via `lastCourt`
- fatigue and `JUST_FINISHED` penalties

The engine should not pair very uneven level teams just to satisfy gender preference.

## Replacement Flow

Operators can replace a player inside a suggestion.

Replacement candidates may come from:

- waiting players
- just-finished players
- players in other suggestions

Players currently `PLAYING` on a court must not be offered as replacement candidates.

If a replacement comes from another suggestion, the source suggestion should be updated to prevent duplicate players across suggestions.

## Operator Authority

Suggestions are advisory. The operator decides when to refresh, apply, replace, start, end, or cancel.
