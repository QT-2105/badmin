# Stage Completion Implementation Plan

Status: NOT STARTED

## Plan

1. Re-read sprint scope and protected files.
2. Confirm capability availability.
3. Prepare presentation-only changes in allowed files.
4. Preserve all handlers, payloads, defaults, validation, permissions, routes, query keys, and mutations.
5. Run validation.
6. Update completion report and stop.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build` at checkpoint or when source changes
- `npm run guard:no-db-schema-automation` at checkpoint or completion
