# Sprint 12.7C Protected Files

## Protected Runtime Logic

- `src/lib/badminton-store.ts`
- `src/hooks/use-runtime-hydration.ts`
- `src/hooks/use-runtime-sync.ts`
- `src/app/api/runtime/snapshot/**`
- `src/repositories/**`
- `src/services/**`
- `src/app/api/sessions/**`
- `src/app/api/session-players/**`
- `src/app/api/match-history/**`

## Protected Contracts

- Waiting queue source and ordering.
- `PRIORITY`, `WAITING`, `JUST_FINISHED`, `PLAYING`, `RESTING` status semantics.
- Pairing algorithm and next-match generation.
- Court assignment and current match references.
- Apply, start match, end match and swap pair callbacks.
- Runtime hydration and synchronization.
- Zustand action signatures.
- API payloads and query/mutation behavior.

## Protected Functions / Calls

- `applyNextMatch`.
- `refreshNextMatches`.
- `replaceNextMatchPlayer`.
- `toggleNextMatchLock`.
- `swapPairs`.
- `startMatch`.
- `endMatch`.
- `cancelReadyCourt`.
- `commitRuntimeSnapshot`.
- `onRecordMatch`.

