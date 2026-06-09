# Performance Constitution

Version: 2026-06-09

## Runtime Performance Goal

Runtime actions must feel immediate on tablet and phone.

Prioritize:

- low render complexity
- bounded scroll areas
- small headers
- stable card dimensions
- optimistic state
- explicit snapshot commits
- avoiding repeated DB calls during selection

## Database Call Budget

Avoid patterns that call DB:

- on every render
- on every local selection
- on every drag/hover
- on a timer without owner-approved sync need

Allowed DB calls:

- initial page load/hydration
- explicit create/update/delete
- runtime snapshot commit after meaningful action
- report/summary fetching by selected period
- product options fetching for session completion shuttlecock selection

## Build Quality

After changes, prefer running:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

If not run, state why.
