# Sprint 11.10 — Acceptance Checklist

## Form Presentation

- [x] Shared inputs have clear focus-visible state.
- [x] Shared inputs support invalid presentation through `aria-invalid`.
- [x] Shared Select and Textarea support invalid presentation.
- [x] Checkbox touch target is improved.
- [x] Switch touch target and reduced-motion presentation are improved.
- [x] Shared Radio primitive exists for future form adoption.
- [x] Form error message has alert semantics.
- [x] Required marker primitive exists.
- [x] Numeric inputs use tabular numbers and right alignment by default.
- [x] Date/time inputs use tabular numbers by default.

## Behavior Preservation

- [x] Field names unchanged.
- [x] Field types unchanged.
- [x] Default values unchanged.
- [x] Validation/schema unchanged.
- [x] Payloads unchanged.
- [x] Submit handlers unchanged.
- [x] Mutations unchanged.
- [x] Reset behavior unchanged.
- [x] Auto-save/manual-save strategy unchanged.
- [x] Permissions and routes unchanged.

## Validation

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run guard:no-db-schema-automation`
- [x] Protected diff clean.

## Deferred

- [ ] Browser/device visual QA for every form.
- [ ] Screen-reader pass for helper/error announcement in all form variants.
- [ ] Broader consumer migration from local labels to structured form primitives.

