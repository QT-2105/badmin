# System Philosophy

Version: 2026-06-09

## Operating Principle

Badmin prioritizes operator speed, touch ergonomics, and low cognitive load over enterprise abstraction.

The best implementation is the smallest implementation that lets an operator run a real badminton session without confusion.

## What The Product Optimizes

- fast play-date and session setup
- quick session player entry
- safe session start only when enough players exist
- compact runtime header and large court management area
- clear next-match suggestions
- manual player replacement before applying matches
- ability to cancel a ready court and return players to the queue
- explicit save/commit actions instead of constant database writes
- simple closing workflow that computes session finance and shuttlecock usage

## What The Product Avoids

- global player membership systems
- deep admin dashboards
- enterprise finance/accounting flows
- warehouse inventory concepts
- event replay and audit reconstruction
- mandatory automatic matchmaking
- runtime screens outside a session

## Operator-First Rule

The operator always has final authority.

AI or automatic matching may suggest:

- who should play next
- how teams should be paired
- which players are eligible for replacement

But the operator must always be able to:

- refresh suggestions
- apply or ignore suggestions
- replace players in a suggestion
- cancel a ready court before start
- start and end matches manually
- edit session players when the session is not locked

## Lightweight Runtime Rule

Runtime behavior must stay local and fast. The app should call the database when the operator performs meaningful actions, not because React rendered or because a screen is open.
