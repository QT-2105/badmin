# Owner Intent

Version: 2026-06-09

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
- session start requires enough players: `court_count * 6`
- completed sessions lock runtime editing
- past dates are review-only for schedule operations
- unfinished past sessions may still need completion accounting updates
- shuttlecock stock must never go negative
- every stock change must create a movement
- session profit must include court and shuttlecock costs
- manual thu chi does not require choosing a session
- finance and inventory reports default to current month and can switch to year
- settings remain simple and browser-local unless owner requests shared configuration

## Development Intent

Continue incrementally. Remove verified unused code. Do not redesign protected runtime systems unless explicitly asked.
