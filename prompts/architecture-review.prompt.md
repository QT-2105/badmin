# Architecture Review Prompt

```text
Read AGENTS.md, docs/README.md, canonical docs, rules, and the affected source.

Prioritize findings:
1. immediate post-match WAITING or operator-authority regression
2. eligibility, wait protection, Trận kế, End-Game, Couple, Host, or exact-quartet drift
3. duplicate/stale players, courts, previews, or runtime revision errors
4. completed/cancelled runtime mutability
5. excessive DB calls, concurrency loss, or partial finance/inventory mutation
6. auth, permission, bootstrap, or route-guard regression
7. session-scoped architecture or navigation drift
8. beta/production database isolation or schema automation risk
9. tablet/mobile operational UX regression
10. unnecessary abstraction or dead code

For each finding include file/line, observed behavior, violated contract, impact, and smallest safe fix. If clean, list residual risks and validation gaps.
```
