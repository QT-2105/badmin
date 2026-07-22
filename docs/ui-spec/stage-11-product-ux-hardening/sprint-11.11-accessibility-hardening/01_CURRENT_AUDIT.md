# Sprint 11.11 — Accessibility Audit

## Audit Matrix

| Area | Result | Action |
| --- | --- | --- |
| Heading hierarchy | Page and section headings use existing `PageHeader`, `SectionCard`, `FormSection`, and Dialog headings. | No structural change required. |
| Landmarks | App shell had a `main` landmark but no skip link target. | Added skip link and `main-content` target. |
| Main navigation | Desktop nav had active state and `aria-current`; desktop nav needed explicit nav label. | Added `aria-label="Điều hướng chính"`. |
| Active navigation | Desktop/mobile links expose `aria-current`; active state includes text where visible. | Preserved. |
| Form labels | Stage 11.10 hardened form primitives and helper associations. | Reviewed; no logic change. |
| Helper text | Finance and Schedule numeric helpers use `aria-describedby`. | Preserved. |
| Error association | Shared `FormMessage` announces alert; known field-specific error associations retained. | Preserved. |
| Dialog semantics | Shared Dialog already had portal, role, aria-modal, title/description, focus trap, Escape, scroll lock, and focus return. | Reused Dialog for PlayerQuickView and session completion confirmation. |
| Drawer semantics | Drawer had portal, aria-modal, focus trap, Escape, and focus return; unnamed drawer fallback was weak. | Added optional/fallback accessible label. |
| Table headers | Shared DataTable uses `th scope="col"` and captions where provided. | Preserved. |
| Mobile table cards | Mobile card mode did not expose list/listitem semantics. | Added `role="list"` / `role="listitem"`. |
| Row actions | Product/session/user actions use real buttons/links and accessible labels. | Preserved. |
| Icon-only buttons | Shared `IconButton` provides accessible name; product icon buttons reviewed. | Added decorative `aria-hidden` where safe. |
| Keyboard focus | Shared buttons, links, nav, forms, dialogs, and drawers expose focus-visible. | Hardened theme/fullscreen focus-visible. |
| Escape handling | Dialog/Drawer support Escape; ActionMenu supported Escape but focus return was not explicit. | Added ActionMenu focus return on Escape and select. |
| Focus return | Dialog/Drawer already return focus; ActionMenu needed improvement. | Added trigger ref return focus. |
| Color contrast | Existing semantic token usage preserved; no hard-coded contrast logic changed. | Deferred browser contrast measurement. |
| Status not color-only | StatusBadge carries visible text labels; status icons remain decorative. | Preserved. |
| Reduced motion | Switch and several runtime skeleton/motion states support reduced motion. | Preserved and documented. |
| Touch targets | Theme/fullscreen/action/dialog controls are at least about 40px in hardened areas. | Preserved. |

## Static Search

- `rg "role=\"button\"|window\\.(confirm|alert)|<div[^\\n]*onClick" src/components src/app -g '*.tsx'`: PASS, no remaining matches.
- `git diff --check`: PASS.

## Notes

- Browser-based screen-reader and keyboard tab-order QA remains deferred.
- Runtime fullscreen panels still use custom dark runtime surfaces by design; their handlers and workflow were not changed.

