# Sprint Plan

Status: Planned, not implemented

## Sprint Order

1. `sprint-6.0-audit`
2. `sprint-6.1-layout`
3. `sprint-6.2-header`
4. `sprint-6.3-court-grid`
5. `sprint-6.4-court-card`
6. `sprint-6.5-waiting-queue`
7. `sprint-6.6-next-match`
8. `sprint-6.7-match-history`
9. `sprint-6.8-tablet-responsive`
10. `sprint-6.9-accessibility-regression`
11. `sprint-6.10-stage-completion`

## Execution Rule

Each sprint must complete:

- scope review
- current audit
- allowed/protected file check
- implementation plan
- acceptance checklist
- completion report

Implementation may proceed only one sprint at a time.

## Validation Rhythm

After each implementation sprint:

```bash
npm run lint
npm run typecheck
```

At major checkpoints:

```bash
npm run build
npm run guard:no-db-schema-automation
```
