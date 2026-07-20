# Schedule and Session Settings Implementation Plan

Status: IMPLEMENTED

## Preconditions

- `maxCourtCountPerSession` has an existing persistence source through `localStorage` key `badmin_app_settings`.
- Session name/start/end defaults are hard-coded in the create-session form and do not have a Settings persistence source.
- Calendar week start and default date view do not have Settings capabilities.

## Setting Preservation Matrix

| Setting | Current source | Used by | Default | Validation | Persistence | Handler | Required preservation |
|---|---|---|---|---|---|---|---|
| Max court count per session | `settings.maxCourtCountPerSession` from `useAppSettings()` | Create/edit session UI in `play-date-detail-client.tsx` | `3` | `normalizeMaxCourtCount`, clamped `1..12` | `localStorage` key `badmin_app_settings` | `setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(value))` | Preserve key, default, validation, handler, and consumer behavior. |
| Default session name | Hard-coded create form state | Create session form | `Ca tối` | Existing form behavior | None | None | READ_ONLY/MISSING for Settings; do not implement. |
| Default start time | Hard-coded create form state | Create session form | `20:00` | Existing form behavior | None | None | READ_ONLY/MISSING for Settings; do not implement. |
| Default end time/duration | Hard-coded create form state | Create session form | `22:00` | Existing form behavior | None | None | READ_ONLY/MISSING for Settings; do not implement. |
| Default note, calendar week start, default date view | Not found | None | Not applicable | Not applicable | None | None | MISSING; do not implement. |

## Implementation

1. Improve only the presentation of the existing `Lịch chơi` Settings section.
2. Add a compact readout for the current maximum court count.
3. Improve helper text, input width, and contextual chips.
4. Preserve the existing numeric input, min/max, normalization, localStorage persistence, and handler.
5. Do not modify play date/session creation defaults directly.

## Protected Files

- Play date/session create and edit workflow.
- API routes.
- Repositories.
- Services.
- Prisma/database files.
- Runtime, finance, inventory, auth, and permission logic.
- `src/lib/app-settings.ts` and `src/hooks/use-app-settings.ts` behavior.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
