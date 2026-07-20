# Runtime Workflow Baseline

Status: Baseline captured from source audit

Source code changed: No

## Entry

Runtime route:

- `/sessions/[sessionId]/runtime`

Runtime frame loads session context, hydrates current runtime state, and starts explicit sync support.

## Header Workflow

Operator can:

- return to Dashboard
- return to Session detail
- use fullscreen toggle
- open match history
- open player list

Leaving may warn when sync state is pending, syncing, or error.

## Scheduling Eligibility

Scheduling is disabled when:

- session is not active
- session is readonly/completed/cancelled
- player count is below required minimum
- auto-match tag/status conditions block suggestions

## Auto Match Workflow

Operator clicks `Auto xếp cặp`.

Current behavior:

1. Check block reason.
2. Call `refreshNextMatches(selectedSuggestionMode)`.
3. If suggestions exist, commit runtime snapshot.
4. If none, show operator notice.

Do not change this sequence.

## Court Workflow

Court states:

- `EMPTY`
- `READY`
- `PLAYING`

Operator can:

- apply suggestion to empty court
- cancel ready court
- swap pairs before start
- start ready court
- end playing court

Ending a match builds match history payload, commits runtime snapshot, then records match history.

## Next Match Workflow

Operator can:

- view suggestions
- lock/unlock suggestion
- apply suggestion
- open replacement UI
- choose slot to replace
- choose replacement player
- save replacement changes

Do not change replacement eligibility or save behavior.

## Player List Workflow

Operator can:

- open full player list
- sort display locally
- edit player fields
- toggle tags
- update payment
- save dirty changes explicitly
- quick-view player details

Do not auto-save on render or temporary UI state.

## Match History Workflow

Operator can:

- open history fullscreen panel
- filter by player
- review ended matches
- close panel

History remains read-only in Stage 06.
