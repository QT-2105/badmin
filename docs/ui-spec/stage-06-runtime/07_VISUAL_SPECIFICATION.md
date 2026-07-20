# Visual Specification

Status: Draft

Source code changed: No

## Runtime Frame

- Keep full-height operational shell.
- Use bounded scroll regions.
- Keep primary runtime controls visible on tablet landscape.
- Avoid extra whitespace.

## Header And Controls

- Compact and sticky if current layout safely supports it.
- Session identity, status, sync state, and escape controls must remain visible.
- Buttons must have readable enabled/disabled states.
- Icon-only controls need accessible labels.

## Court Area

- Court cards should be visually consistent and compact.
- Court status must be scannable.
- Player names must not break layout.
- Empty/ready/playing states must remain visually distinct.

## Court Card

- Preserve action order and labels unless explicitly approved.
- Improve hierarchy: court name, state, players, timer, actions.
- Keep touch targets large enough for tablet.

## Waiting Players

- Keep dense operational list.
- Tags should be legible but compact.
- Dirty/save state must remain obvious.
- Wide table must remain horizontally scrollable when needed.

## Next Match

- Suggestion cards must show pairs clearly.
- Lock/apply/replace controls must remain close to suggestion title.
- Replacement panel must clearly show selected slot and replacement candidates.
- Score/quality indication must not imply algorithm changes.

## Match History

- Fullscreen review can remain.
- Filter and close controls must be clear.
- History rows/cards must remain read-only.

## Responsive Targets

- Primary: tablet landscape.
- Secondary: mobile portrait.
- Desktop: supported but not the primary operational target.

## Theme

- Runtime is currently dark-first.
- Stage 06 may token-normalize dark presentation.
- Light-mode runtime changes require extra QA because runtime is operationally sensitive.
