# Stage 11 Validation Protocol

## Required Commands For Implementation Sprints

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Run `npm run guard:no-db-schema-automation` at every checkpoint that touches product source.

If a test script exists later, run it. Do not add test infrastructure inside Stage 11 unless explicitly requested.

## Protected Diff Command

```bash
git diff --name-only -- src/app/api src/repositories src/services prisma src/lib/badminton-store.ts src/lib/auth
```

Expected result for Stage 11 implementation:

- no output, unless a sprint explicitly escalates and receives approval.

## Manual QA Matrix

- Light mode.
- Dark mode.
- Desktop.
- Laptop.
- Tablet landscape.
- Tablet portrait.
- Mobile smoke.
- Keyboard-only.
- Touch target scan.
- Dialog/drawer focus.
- Container-local overflow.

## Failure Policy

If validation fails:

1. Stop the sprint.
2. Document the failing command and error.
3. Do not continue to the next sprint.
4. If failure is caused by protected logic needs, mark the sprint BLOCKED.

