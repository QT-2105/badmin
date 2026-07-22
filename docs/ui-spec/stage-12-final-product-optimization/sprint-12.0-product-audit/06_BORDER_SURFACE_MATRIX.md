# Border and Surface Matrix

## Matrix

| Surface | Current baseline | Risk | Notes |
| --- | --- | --- | --- |
| App shell | tokenized border/surface | Low | Needs dark/light visual QA. |
| Page shell | shared `PageShell`, `PageHeader`, `SectionCard` | Low | Page-level overflow hardened in Stage 11. |
| Data surfaces | `DataTable`, `Surface`, `SectionCard` | Low | Local scroll containers are expected. |
| Dialog | shared `Dialog` with portal and focus handling | Low | Stacking should be QA'd with nested surfaces. |
| Drawer | shared `Drawer` with portal and focus handling | Low | Current usage is limited. |
| Runtime shell | custom dark operational panels | Medium | Many direct dark surfaces and custom shadows. |
| Cards | shared `Surface`/`Card` and custom runtime cards | Medium | Runtime cards intentionally differ. |
| Destructive zones | tokenized danger surfaces | Low | Settings and confirmation dialogs are explicit. |

## Findings

- Border and surface usage is consistent outside Runtime.
- Runtime uses stronger dark surfaces and custom elevation; keep unless a confirmed visual/accessibility issue appears.
- No evidence of overly strong shared shadow after Stage 11, but browser screenshot QA remains required.

