# Runtime Failure Strategy

Version: 2026-06-09

## Expected Failures

The runtime must tolerate:

- refresh during a session
- accidental tab close
- temporary network failure
- DB sync error after an optimistic action
- user leaving runtime while sync is pending

## Recovery Model

Recovery uses current database snapshots:

- session metadata
- session players
- runtime courts
- runtime matches

If runtime court rows are missing, derive empty courts from `play_sessions.court_count`.

## Sync Failure UX

The runtime top bar can warn about pending/sync/error states. Leaving runtime may prompt if state is not synchronized.

Do not block live court operation because sync is temporarily unhealthy.

## Completion Recovery

Completing a session is transactional. If completion fails, do not partially lock the UI. If completion succeeds:

- players become finished
- courts become empty
- runtime matches are removed
- stock is decremented
- session finance totals are saved
