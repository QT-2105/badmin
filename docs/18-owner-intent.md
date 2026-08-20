# Owner Intent

Version: 2026-08-13

## Core Intent

The owner wants a practical badminton operation tool that works in real sessions.

The system should help manage:

- play dates
- sessions
- players
- court orchestration
- next-match suggestions
- payments
- session completion
- shuttlecock stock
- simple finance reports

## Current UX Intent

- root menu stays small
- runtime is contextual inside a session
- court management and next suggestions are one area
- player list can open full screen for final payment review
- dead buttons and unused tabs should be removed
- UI should be compact and modern
- notifications should not clutter the interface
- expand/collapse labels must be consistent

## Current Logic Intent

- DB should not be selected/written continuously during runtime
- buttons and meaningful actions commit to DB
- session start requires at least four players; suggestions may fill any valid subset of courts without requiring six players per court
- completed sessions lock runtime editing
- past dates are review-only for schedule operations
- unfinished past sessions may still need completion accounting updates
- shuttlecock stock must never go negative
- every stock change must create a movement
- session profit must include court and shuttlecock costs
- manual thu chi does not require choosing a session
- finance and inventory reports default to current month and can switch to year
- settings remain simple and operational; shared configuration belongs in `app_settings`, while collection-style settings such as payment bank accounts use dedicated tables
- `Đã tới` makes a player attendance-eligible; selecting `Host` also marks `Đã tới` because Host is an on-site operator role; `Trận kế` does not override attendance
- auto-suggestion should explain why it cannot produce a match instead of silently writing empty runtime state
- players return to the waiting pool immediately after a match; the operator may schedule consecutive matches without a cooldown lock
- late arrivals receive limited help entering the rotation, not full catch-up; earlier arrivals must not be skipped for multiple compatible rounds
- `Trận kế` is a one-shot request and `End-Game` means no more new matches in the current session
- Couple partners remain together only in the registered match format and are ordinary independent players in other formats
- auto-suggestion should avoid only the exact recent quartet when an acceptable alternative exists
- female players are treated as one effective level lower than displayed level when balancing mixed-gender matches
- same-format pairings are preferred when level balance is acceptable
- mixed-format pairings are fallback options when they improve level balance or eligible players are limited

## Development Intent

Continue incrementally. Remove verified unused code. Do not redesign protected runtime systems unless explicitly asked.
