# UI Preservation Prompt

```text
Read AGENTS.md, docs/ui-ux.md, docs/runtime.md, and rules/protected-modules.yaml.

Preserve:
- permission-filtered root navigation: Dashboard, Lịch chơi, Thu chi, Kho cầu, Người dùng, Cài đặt
- runtime only inside a session
- fixed/collapsible desktop sidebar and compact mobile navigation
- compact runtime header, courts and previews in one management area
- full-screen player and history access
- Mở rộng / Thu gọn labels
- large touch targets, bounded scrolling, simple numeric inputs, readable labels
- auth and permission behavior behind Người dùng

Prefer existing consumed shared primitives. Do not add speculative primitives; remove unused presentation exports only after graph verification. Ask before protected runtime layout or navigation changes.
```
