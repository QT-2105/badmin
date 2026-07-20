# Implementation Plan

1. Preserve movement row mapping. Done.
2. Preserve `visibleMovements` source and existing order. Done.
3. Improve title/note hierarchy. Done.
4. Improve badge and numeric readability. Done.
5. Improve product reference, quantity direction, unit price, total amount, and timestamp presentation. Done.
6. Preserve pagination and row order. Done.
7. Do not add new drawer/dialog because no existing movement detail action exists. Done.
8. Validate. Done.

## Guardrails

- No new date grouping.
- No new sorting.
- No mutation or action added.
- No route/query/permission changes.
- No movement detail data transformation beyond row rendering.
