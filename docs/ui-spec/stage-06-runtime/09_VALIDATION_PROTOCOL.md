# Validation Protocol

Status: Required before implementation

## Baseline

Before any source changes:

```bash
git status --short
git diff --stat -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts src/lib/auth
```

## Per Sprint

Run after each implementation sprint:

```bash
npm run lint
npm run typecheck
```

## Checkpoint

Run after layout/header/court/next-match groups:

```bash
npm run build
npm run guard:no-db-schema-automation
```

## Runtime Regression Review

Manually verify:

- auto suggestions still generate the same way
- locked suggestions remain locked
- replacement saves correct players
- apply match still targets empty court
- cancel ready court still returns players to queue
- swap pairs still swaps teams
- start/end match still works
- match history still records on end
- player save still writes explicitly only on save

## Stop Conditions

Stop immediately if validation reveals:

- protected diff in store/API/service/repository/Prisma
- changed runtime action arguments
- changed queue/suggestion behavior
- changed DB sync timing
- broken build or typecheck

Also stop immediately if a UI implementation requires changing:

- queue source or sorting
- priority mapping
- player runtime status
- match generation or pairing criteria
- court/current match assignment references
- start/end/swap/apply behavior
- match history source
- runtime hydration or synchronization
- Zustand actions
- query keys or mutations
- API payloads
- repository queries
- service calculations
- routes or permissions
