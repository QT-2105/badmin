# Runtime and scheduling

Version: 2026-09-04

## Authority and lifecycle

The operator has final authority. Suggestions are advisory and never auto-apply.

Player lifecycle:

`WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> WAITING`

Court lifecycle:

`EMPTY -> READY -> PLAYING -> EMPTY`

Ending a match increments the real match count, records `lastFinishedAt`, and
returns players to `WAITING` immediately. `lastFinishedAt` is soft
scheduling metadata only; it must not create a cooldown or block consecutive
manual matches.

A READY court can be cancelled. Its exact roster and team split return to the
front of the preview queue as an operator Lock.

## Runtime ownership and persistence

`src/lib/badminton-store.ts` owns players, courts, suggestions, session state,
fairness metadata, replacements, start/end/cancel actions, and hydration
mapping.

Important actions commit one current snapshot after the local transition:

- refresh or apply suggestions;
- replace or reshuffle players;
- start, end, or cancel a court;
- persist relevant runtime player edits.

Suggestion enumeration and temporary UI changes are pure local computation and
must not query or write the database. A blocked action must explain its reason
and must not commit an empty or invalid snapshot.

Snapshot revisions protect concurrent operation. A revision conflict requires
reloading the newest persisted snapshot; do not silently merge or overwrite
another device.

Every snapshot write must carry the caller's explicit current revision. The
repository claims `(club_id, session_id, status = LIVE, runtime_version)` with
one compare-and-swap update before changing players, courts, or matches. A
missing or stale revision and a completed/cancelled session are rejected with
a conflict; there is no revision-less compatibility write.

Runtime JSON rosters are validated on both commit and hydration. Every roster
must contain four unique players from the same tenant session, and one player
cannot be reserved in multiple current courts/previews.

## Eligibility and operational state

Auto-suggestion requires an active, unlocked session and eligible
`WAITING` players. Legacy hydrated `JUST_FINISHED` values remain accepted during
migration but receive no cooldown and are not generated when ending a match.

- `Chưa tới`: default attendance state; not auto-eligible.
- `Đã tới`: attendance-positive and auto-eligible.
- `Trận kế`: one-shot request consumed only when the player or valid Couple
  starts a match.
- `Host`: on-site operator fallback; selecting it also marks `Đã tới`, but
  Host receives no automatic catch-up, wait, or request priority.
- `End-Game`: excluded from new suggestions and replacements while retaining
  role, fee, match count, and Couple data.
- legacy `Chấn thương` and `Về sớm` normalize to `End-Game`.
- `PLAYING`, `RESTING`, and `FINISHED` are unavailable.

Hard safety always blocks missing or duplicate players, unavailable attendance,
End-Game, court conflicts, inactive sessions, and stale revisions.

## Suggestion order

The engine uses ordered constraints:

1. eligibility, requested mode, four unique players, no court conflict, and
   registered-format Couple constraints;
2. maximum disjoint valid match count, capped by court count;
3. acceptable team-level balance;
4. avoid Host when ordinary players can produce the same batch size;
5. wait protection and valid `Trận kế`;
6. limited late-arrival entry assistance;
7. match fairness and waiting age;
8. registered-format Couple preference;
9. exact-quartet and soft last-finished criteria;
10. deterministic tie-breaking.

No preference may create a severely unbalanced match. When a full court-count
batch is feasible, bounded search must include a cardinality-recovery path so
overlapping high-score candidates do not underfill it.

## Queue and Lock behavior

The next-match area is a self-filling FIFO preview queue.

- applying one preview preserves other valid previews and appends a top-up;
- consuming the final preview creates a new batch when possible;
- READY/PLAYING players are reserved but do not reduce the preview target;
- impossible targets return the maximum valid count;
- Auto refresh may vary unlocked preview quartets but never changes Locks;
- restored or manually locked previews survive Auto refresh;
- an explicit operator edit may change a Lock while preserving its Lock flag;
- moving a player across previews updates every affected roster atomically and
  revalidates the complete queue before one commit.

## Fairness and formation

Late arrivals receive limited entry assistance, never catch-up for every match
played before arrival. A compatible earlier arrival skipped by an applied or
started suggestion gains wait protection. Refresh alone does not manufacture a
skipped round.

For internal balance, female players use an effective level one step below the
displayed level; labels shown to users do not change.

Pure formations are preferred when balance is acceptable:

- nam-nam vs nam-nam;
- nữ-nữ vs nữ-nữ;
- nam-nữ vs nam-nữ.

Cross-format formations are Auto-only, lowest-tier fallbacks when they improve
the achievable valid match count or balance. Explicit format tabs remain
strict. Cross-format rosters persist as `AUTO` so Apply validation does not
misclassify them.

## Couple, request, and anti-repeat

A Couple is a session-scoped two-player relationship registered for one format.
Partners stay together automatically only in that format and behave as
independent players elsewhere. A Couple never bypasses attendance,
availability, balance, duplicate, or court constraints.

An individual `Trận kế` does not request a match for a partner. A Couple
request applies only in its registered format when both members are eligible.
Requests survive refresh/cancel and are consumed on match start.

Anti-repeat compares only the unordered quartet of four session-player IDs.
Court, ordinary teammate, and ordinary opponent repetition are not penalties.
Allow the only acceptable quartet with an operator-facing warning.

## Replacement and override

Replacement candidates may come from waiting players or other suggestions, but
never from playing, End-Game, absent, court-bound, or otherwise ineligible
players. Moving a player out of another suggestion must repair that source and
prevent duplication.

Manual edits may override format, balance, Couple partnership, quartet
freshness, and Host avoidance after a visible warning. They may not override
hard safety.

## Failure and completion

Temporary sync failure may show pending/error state without blocking live court
operation. A version conflict does block further mutations until reload.

Session completion is transactional. Failure must not partially lock runtime or
partially change finance/inventory. Success finishes players, empties courts,
removes runtime matches, updates stock through a movement, and stores session
totals.

Completion atomically claims a LIVE session once and advances its runtime
revision. Concurrent retries observe the committed FINISHED state and cannot
create another summary, movement, or generated transaction set. Completion and
manual inventory mutations acquire the same product row lock before reading
stock so their read/check/write sequences are serialized.
