# Scheduling Engine Constitution

Version: 2026-08-13

## Protected Lifecycle

The protected player flow is:

`WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> WAITING`

Current implementation details:

- `NEXT_MATCH` is represented by `nextMatches`
- players in a prepared suggestion/court can be marked `PRIORITY`
- `PLAYING` players cannot be selected as replacements
- ending a match increments real match counts, records `lastFinishedAt`, and returns players to `WAITING` immediately
- `lastFinishedAt` is a soft tie-break/explanation and never blocks a manual consecutive match

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

The suggestion engine uses ordered decision layers rather than allowing one opaque score to override every concern:

1. hard eligibility, match format, no duplicate player, and Couple partner constraints
2. maximum disjoint valid match count, capped by the session court count
3. acceptable team-level balance
4. avoid Host when enough ordinary eligible players can fill the same valid batch
5. wait protection and valid one-shot `Trận kế` requests
6. limited entry assistance for late arrivals
7. adjusted match fairness and waiting age
8. Couple preference in the registered format
9. exact-quartet anti-repeat and soft last-finished criteria
10. stable deterministic tie-breaking

The engine must not create a very uneven match merely to satisfy `Trận kế`, Couple, gender preference, late-arrival assistance, or match-count fairness.

When enough eligible players satisfy the hard constraints, a generation returns one disjoint suggestion per configured court. Bounded search may control latency, but it must include a cardinality recovery path so overlapping high-score candidates cannot underfill an otherwise feasible four-court batch.

`Auto gợi ý` treats the current unlocked preview quartets as soft anti-repeat input. Repeated clicks therefore produce a materially different valid option when one exists. This preview-only variation never becomes match history, never increments waiting protection, and never changes a locked preview.

The next-match area is a self-filling preview queue, not a one-time batch that permanently shrinks:

- applying one preview preserves every other valid preview in FIFO order and compacts them toward the front
- the missing preview is regenerated at the end of the queue in the same Zustand transition
- consuming the final preview creates the next batch automatically when enough eligible players remain
- READY and PLAYING courts reserve their players but do not reduce the preview target; previews represent following matches
- top-up does not turn preserved previews into operator Locks and does not create an extra DB write
- if hard constraints make the court-count target impossible, return the maximum valid count instead of an empty or misleading batch

Cancelling a READY court restores the exact four-player roster and team split at the front of the preview queue as an operator Lock. The restored preview remains editable and survives `Auto gợi ý`. If the queue is full, the newest unlocked tail preview is removed first; operator Locks are never silently discarded, so a temporary queue overflow is allowed when every preview is locked.

Host is an operational fallback, not a normal participant owed automatic rotation. The engine first tries to fill the complete batch using ordinary players. Host options are considered only when they increase the achievable valid match count, and only the minimum Host count is used. Host does not receive automatic wait protection, late-arrival assistance, or `Trận kế` priority. The operator may always place an eligible Host manually.

## Arrival And Waiting Fairness

Matches played before a player first arrives are not owed matches.

- first arrival records an arrival baseline and may grant one limited entry-assistance opportunity
- the displayed and charged match count remains the real match count
- adjusted match fairness is internal scheduling metadata only
- after the first played match, a late arrival returns to the ordinary rotation instead of receiving consecutive catch-up matches
- a compatible player skipped by an applied/started suggestion gains wait protection
- refreshing suggestions alone must not manufacture skipped rounds or additional priority
- wait protection outranks ordinary late-arrival assistance, so earlier arrivals are not automatically skipped for two or three compatible rounds

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
- `Trận kế`: a one-shot request, not a permanent priority; consumed only when the requested match starts
- `Host`: on-site operator role; selecting it also marks `Đã tới`, avoids automatic wait/catch-up/request priority, and may fill a match only when needed
- `End-Game`: excluded from new suggestions and replacements; keeps role/payment/match/Couple data
- legacy `Chấn thương` and `Về sớm` values normalize to `End-Game`

Attendance, role, availability, requests, and relationships are separate concepts. `Host` carries attendance because it represents an on-site operator, but it still does not receive automatic rotation priority. `Host` must not be removed by `End-Game`, and Couple is not stored or evaluated as a free-form player tag.

## Couple Semantics

A Couple is a session-scoped two-player relationship registered for one match format.

The current lightweight persistence stores the same `couple_number` and `couple_match_mode` on both session-player rows. Couple data must not introduce a global player relationship or require a separate relationship table unless owner-approved requirements outgrow the one-partner-per-session model.

- `Couple_n · Nam nữ` must remain partners in automatic mixed-doubles suggestions
- `Couple_n · Đôi nam` and `Couple_n · Đôi nữ` apply only to their registered same-gender format
- in all other formats, each member is an ordinary independent player
- a Couple never bypasses arrival, `End-Game`, playing/reservation, duplicate-player, or team-balance constraints
- if one partner is unavailable, the other is not automatically paired with somebody else in the Couple format, but remains eligible in other formats
- the operator may split a Couple for one match after an explicit warning; this must not delete the session Couple relation
- Couple display numbers identify the relationship and never affect scheduling priority

## Trận Kế

- individual `Trận kế` does not silently request a match for the partner
- Couple `Trận kế` applies only to the registered Couple format and requires both members to be eligible
- requests survive suggestion refresh/cancel and are consumed only on match start
- FIFO request time, match fairness, wait protection, and balance jointly decide which valid request is served

If auto-suggestion cannot produce a useful match because attendance tags, status, or gender-mode counts are insufficient, the UI must explain the reason and avoid a meaningless DB snapshot commit.

## Anti-Repeat

Only the exact unordered quartet of four session-player IDs is considered for automatic anti-repeat.

- do not penalize court repetition
- do not penalize ordinary teammate or opponent repetition
- Couple partners are expected to repeat in their registered format
- avoid a recent quartet when another acceptable option exists
- if the quartet is the only acceptable option, allow the suggestion with an operator-facing warning
- use player IDs, never display names, for the quartet signature

## Replacement Flow

Operators can replace a player inside a suggestion.

Replacement candidates may come from:

- waiting players
- players in other suggestions

Players who are `PLAYING`, `End-Game`, `Chưa tới`, already on a court, or otherwise ineligible must not be offered as replacement candidates.

If a replacement comes from another suggestion, the source suggestion should be updated to prevent duplicate players across suggestions.

Replacing or reshuffling a player must revalidate format, balance, Couple, and duplicate-player constraints. A stale suggestion must not be applied until it is repaired or regenerated.

Lock protects a preview only from automatic refresh and automatic top-up. It never blocks an explicit operator edit. If a player is moved between two locked previews, both rosters are updated in one store transition, both Lock flags remain set, and every affected preview is revalidated before one snapshot commit. The UI must disclose the affected preview numbers before save.

Manual operator edits may override auto format, level balance, Couple partnership, exact-quartet freshness, and Host avoidance after a visible warning. Hard safety still blocks missing or duplicate players, unavailable attendance, End-Game, court conflicts, inactive sessions, and stale runtime revisions.

## Operator Authority

Suggestions are advisory. The operator decides when to refresh, apply, replace, start, end, or cancel.
