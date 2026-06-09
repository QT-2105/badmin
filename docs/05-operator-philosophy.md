# Operator Philosophy

Version: 2026-06-09

## Final Authority

The operator must remain in control of every live scheduling decision.

The app may suggest, warn, disable invalid actions, and persist state. It must not fight the operator.

## Low-Friction Runtime

The runtime should make the common live actions visible:

- see total, waiting, just-finished, playing, resting counts
- see all courts
- see next suggestions in the same court-management region
- refresh suggestions
- apply a suggestion to an empty court
- replace a suggested player
- cancel a ready court if clicked wrong
- start and end matches
- open full-screen player list for payment/player review

## Session Detail Authority

The session detail screen owns:

- player CRUD before lock
- start session
- completion information
- complete session confirmation
- access to runtime

Completion must remain deliberate because it locks runtime editing and creates operational finance/inventory consequences.

## Past Date Behavior

Past play dates are review-first. They should allow opening session details and reviewing history. They should not allow creating, editing, or deleting play dates/sessions, except unfinished sessions may still update completion-related accounting fields where needed by current business rules.

Schedule controls should prefer disabled buttons and the `Chỉ xem lại` label over repeated warning text.

## Error UX

Errors should be useful but not noisy. Prefer disabled controls and short actionable messages over repeated explanatory blocks.
