# Glossary

Version: 2026-08-13

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

## Last Finished At

Soft timestamp recorded when a player finishes a match. It may explain or rank otherwise-equivalent suggestions but never creates a mandatory cooldown.

## Player Tags

Attendance and operational state on a session-scoped player. Current visible values are `Đã tới`, `Chưa tới`, `Host`, `End-Game`, and `Trận kế`. Legacy `Chấn thương` and `Về sớm` values normalize to `End-Game`.

## End-Game

Session-scoped availability state meaning the player has ended play for the current session and must not enter new suggestions or replacement lists. It does not remove Host, fee, match-count, or Couple data.

## Trận kế

One-shot request for the next acceptable match. It is consumed only when the player or requested Couple starts a match and does not bypass attendance, availability, duplicate-player, format, or balance constraints.

## Couple

Session-scoped relationship between two players who ordered a fixed partner in one registered format. Both player rows store the same `couple_number` and `couple_match_mode`; no separate Couple entity is required. They must remain teammates in automatic suggestions for that format and behave as ordinary independent players in other formats.

## Entry Assistance

Limited one-time scheduling support for a player arriving late. It helps the player enter the rotation but does not compensate every match played before arrival.

## Wait Protection

Fairness metadata that prevents a compatible earlier-arriving player from being skipped repeatedly. Refreshing suggestions alone does not count as a skipped round.

## Exact Quartet

Unordered set of four session-player IDs. Recent exact quartets may be avoided when another acceptable option exists; ordinary court, partner, or opponent repetition is not penalized.

## Effective Level

Auto-suggestion balancing value used internally. Male players use displayed level. Female players are treated as one level lower for balancing. Display labels do not change.

## Same-Format Matchup

A match formation where both teams share the same gender structure: `nam-nam vs nam-nam`, `nữ-nữ vs nữ-nữ`, or `nam-nữ vs nam-nữ`.

## Mixed-Format Fallback

A less preferred but allowed formation such as `nam-nữ vs nam-nam`, used when it improves level balance or eligible players are limited.

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

## Operational Settings

Shared settings stored in `app_settings`, including max court count, completion voucher toggles, and the default payment bank account.

## Browser-Local Preferences

Personal UI preferences stored in localStorage, such as theme or sidebar state.
