# Scheduling Engine Constitution

Version: 2026-06-30

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
- team level balance as the strongest quality constraint
- same-format matchups:
  - nam-nam vs nam-nam
  - nữ-nữ vs nữ-nữ
  - nam-nữ vs nam-nữ
- new combinations through recent pair/roster penalties and a small novelty nudge
- anti-repeat via `lastCourt`
- fatigue and `JUST_FINISHED` penalties

The engine should not pair very uneven level teams just to satisfy gender preference.

Current level comparison uses an effective-level rule:

- male players keep their displayed level
- female players are treated as one level lower for balancing
- example: nữ `TBY` balances with nam `Y+`
- example: nữ `TB-` balances with nam `TBY`
- example: nữ `TB` balances with nam `TB-`

This rule only affects auto-suggestion scoring. User-facing labels remain unchanged.

Current gender-format philosophy:

- same-format matches are preferred when level balance is acceptable
- `nam-nữ vs nam-nữ` is preferred strongly
- `nam-nam vs nam-nam` and `nữ-nữ vs nữ-nữ` are preferred strongly
- mixed-format matches such as `nam-nữ vs nam-nam` may be suggested only when they materially improve level balance or when eligible players are limited
- `nam-nam vs nữ-nữ` should be heavily discouraged and normally handled manually by host/operator if desired

Current eligibility tags:

- `Chưa tới`: default attendance state; not eligible for auto-suggestion
- `Đã tới`: eligible for auto-suggestion
- `Ưu tiên`: eligible and boosted
- `Host`: avoided when enough non-host players exist; may fill a match when needed
- `Chấn thương`: excluded
- `Về sớm`: excluded

If auto-suggestion cannot produce a useful match because attendance tags, status, or gender-mode counts are insufficient, the UI must explain the reason and avoid a meaningless DB snapshot commit.

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
