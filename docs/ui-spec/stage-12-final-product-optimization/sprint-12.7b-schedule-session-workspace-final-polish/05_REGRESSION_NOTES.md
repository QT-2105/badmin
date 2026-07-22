# Sprint 12.7B Regression Notes

## Schedule Regression

Confirmed by source scope:

- `usePlayDates`, `usePlayDate` and `useScheduleMutations` calls unchanged.
- Play date sort order unchanged.
- Session sort order unchanged.
- Past-date restrictions unchanged.
- Create/edit/delete handlers and mutation arguments unchanged.
- Route links to `/schedule/[playDateId]` and `/sessions/[sessionId]` unchanged.

## Session Workspace Regression

Confirmed by source scope:

- `usePlaySession`, `useSessionPlayers`, `useSessionPlayerMutations`, `useScheduleMutations`, `useAppSettings` and shuttlecock product option hooks unchanged.
- Player create/update/delete/avatar handlers unchanged.
- Payment total, finance summary and completion profit calculations unchanged.
- Completion draft and complete-session payloads unchanged.
- Runtime route link unchanged.
- Permission checks unchanged.

## Deferred

- Browser screenshot QA for Schedule and Session Workspace light/dark/tablet remains deferred.
- Real CRUD/mutation execution against a seeded database remains deferred.

## Command Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS
- `git diff --check`: PASS
- protected backend/logic diff: PASS
