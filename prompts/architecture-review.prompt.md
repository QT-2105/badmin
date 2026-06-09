# Architecture Review Prompt

Use this prompt to review a Badmin change.

```text
Review the change against Badmin governance.

Read AGENTS.md, /docs/*, and /rules/* first.

Prioritize findings:
1. Runtime lifecycle regression
2. JUST_FINISHED semantic breakage
3. Duplicate players in suggestions/courts
4. PLAYING players offered as replacement candidates
5. Loss of operator override
6. Excessive runtime DB calls or polling
7. Session-centric architecture drift
8. Court_number/current-state persistence drift
9. Session completion finance/inventory drift
10. Mobile/tablet UX regression
11. Enterprise over-engineering

For each finding include:
- file and line
- observed behavior
- governance rule violated
- concrete safer fix

If no issues are found, state that and list residual risks.
```
