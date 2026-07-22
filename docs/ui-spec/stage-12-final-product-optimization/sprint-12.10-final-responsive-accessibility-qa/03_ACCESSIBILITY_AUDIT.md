# Accessibility Audit

## Static Checks

| Area | Result | Evidence |
| --- | --- | --- |
| Heading hierarchy | PASS WITH NOTES | `PageHeader` and section headings are used broadly; exact screen-reader traversal requires manual QA. |
| Landmarks | PASS | App Shell includes navigation and skip link; pages use structured shell/sections. |
| Navigation labels | PASS | Main nav, Settings nav and Runtime groups have labels. |
| Active navigation | PASS | App Shell uses `aria-current`; Settings uses `aria-current=location`. |
| Button accessible names | PASS | Icon/action buttons generally include `aria-label` or visible text. |
| Form labels | PASS | Forms use native labels and inputs/selects. |
| `aria-describedby` | PASS | Helper/error associations exist in Finance, Inventory, Users, Settings and Schedule forms. |
| Error association | PASS WITH NOTES | Error states use alert/status semantics in key forms; manual screen-reader pass recommended. |
| Table headers | PASS | Shared `DataTable` uses native table headers; Users custom table uses table roles. |
| Dialog title/description | PASS | Shared `Dialog` uses `aria-labelledby`, `aria-describedby`, `aria-modal`. |
| Focus trap | PASS WITH NOTES | Shared `Dialog` and `Drawer` implement trap/return; Runtime custom overlays need browser verification. |
| Return focus | PASS WITH NOTES | Shared `Dialog`, `Drawer`, and `ActionMenu` implement return focus; custom Runtime overlays need browser verification. |
| Escape handling | PASS WITH NOTES | Shared `Dialog`/`Drawer` support Escape; custom Runtime overlays need browser verification. |
| Color contrast | PASS WITH NOTES | Tokenized semantic colors are used; exact WCAG measurement not automated. |
| Status not color-only | PASS | Major status badges include text labels. |
| Reduced motion | PASS | Global CSS and key components use `motion-reduce` / reduced-motion checks. |
| Touch targets | PASS WITH NOTES | Shared controls target 40px; some compact Runtime controls need manual tablet check. |

## No Invalid ARIA Added

This sprint did not add or change source ARIA roles. Static scan found a preference for native elements plus shared dialog/drawer semantics.

## Risk Notes

- Runtime match history and fullscreen player list are custom fixed overlays with `role=dialog` and `aria-modal`; they should be manually tested for focus trap, Escape and focus return.
- Permission matrix is custom checkbox grid; static labels exist, but keyboard path should be manually tested with seeded roles.
- Dense Runtime controls are intentionally compact; tablet touch comfort should be verified on device.
