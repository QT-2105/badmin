# Glossary

Version: 2026-06-09

## Dashboard

Business overview screen. Not live scheduling.

## Lịch chơi

Play-date list and creation screen.

## Ngày chơi

One calendar date that contains sessions.

## Ca chơi

One operational play session. Owns players, court count, runtime, completion accounting, and shuttlecock usage.

## Điều phối

Live court orchestration screen inside a session.

## Session Player

Player scoped to one session. Not a global user.

## Court Number

Numeric runtime court identity derived from `play_sessions.court_count`.

## Next Match

Suggested roster for an upcoming match.

## PRIORITY

Runtime status for players selected/prepared in upcoming or ready matches.

## JUST_FINISHED

Cooldown state after a match. Protected fairness mechanic.

## Current-State Runtime

Persistence model where DB stores the current snapshot, not an event stream.

## Runtime Snapshot

Combined current state of session, players, runtime courts, and runtime matches.

## Shuttlecock Movement

Immutable inventory record for import, sale, play usage, adjustment, or other stock changes.

## Avg Cost Per Ball

Weighted average inventory cost per shuttlecock.

## Avg Usage Price Per Ball

Weighted average suggested usage/sale price per shuttlecock used for play usage cost.

## Browser-Local Settings

Settings stored in localStorage, currently used for auto finance voucher behavior and max court count.
