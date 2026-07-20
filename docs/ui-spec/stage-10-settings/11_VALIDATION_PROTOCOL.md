# Validation Protocol

## Required Commands For Implementation Sprints

- `npm run lint`
- `npm run typecheck`
- `npm run build` at checkpoint sprints
- `npm run guard:no-db-schema-automation` at completion and any sprint touching sensitive surfaces

## Documentation-Only Validation

For Sprint 10.0:

- Verify no source files changed for Stage 10.
- Verify all requested docs and sprint docs exist.
- Verify protected file diff is unchanged by Stage 10 work.

## Protected Diff Checks

Use targeted checks before marking implementation sprints complete:

- `git diff --name-only -- src/app/api src/repositories src/services prisma src/lib/app-settings.ts src/hooks/use-app-settings.ts src/hooks/use-branding.ts src/lib/auth src/lib/badminton-store.ts`

Any unexpected protected diff must stop the sprint.

