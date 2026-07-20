# Runtime Safety Contract

Status: Required for all Stage 06 work

## Protected Behavior

The following behavior is protected and must remain unchanged:

- `WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING`
- advisory-only next match suggestions
- operator-first manual override
- lock suggestion behavior
- replace player behavior
- apply match behavior
- auto assign to empty court behavior
- cancel ready court behavior
- start match behavior
- end match behavior
- match history creation on ended matches
- explicit runtime snapshot commits after meaningful operator actions

## Forbidden Changes

Stage 06 must not change:

1. Queue source.
2. Queue sorting.
3. Priority mapping.
4. Player runtime status.
5. Match generation.
6. Auto pairing.
7. Manual pairing.
8. Gender/level pairing criteria.
9. Court assignment.
10. Current match references.
11. Start match.
12. End match.
13. Swap pair.
14. Apply match.
15. Match history source.
16. Runtime hydration.
17. Runtime synchronization.
18. Zustand actions.
19. Query keys.
20. Mutations.
21. API payloads.
22. Repository queries.
23. Service calculations.
24. Routes.
25. Permissions.

These map to the existing implementation concepts:

- scoring or pair generation logic
- waiting queue sort source
- player tag eligibility logic
- player status values
- court status values
- court slot assignment model
- runtime store actions/selectors
- API payloads
- persistence timing
- React Query hooks
- repository/service contracts

## Allowed Changes

Allowed changes are strictly presentational:

- semantic token replacement
- spacing/density
- typography hierarchy
- border/radius/shadow consistency
- icon alignment
- focus-visible styling
- disabled styling
- bounded scroll containers
- player name wrapping/truncation
- responsive grid behavior
- accessibility labels that describe existing actions

## Escalation

Stop and ask before any change that requires handler rewiring, store changes, API calls, new state ownership, or new runtime behavior.

## Out Of Scope Protocol

If a UI change requires changing any item in the forbidden list:

1. Do not modify source code.
2. Record the request as `Out of Scope`.
3. Name the affected file or files.
4. Explain why the change would touch protected runtime behavior.
5. Stop the current task if it cannot continue safely without that protected change.
