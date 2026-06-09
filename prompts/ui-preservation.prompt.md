# UI Preservation Prompt

Use this prompt before changing UI/UX.

```text
Read AGENTS.md, docs/08-ui-ux-constitution.md, docs/09-mobile-tablet-constitution.md, and rules/protected-modules.yaml.

Evaluate the change against current Badmin UI:
- fixed/collapsible desktop sidebar
- mobile sticky horizontal nav
- root nav stays Dashboard, Lịch chơi, Thu chi, Kho cầu, Cài đặt
- runtime is not global navigation
- runtime header remains compact
- QUẢN LÝ SÂN contains courts and next suggestions
- no dead Hàng chờ tab
- Người chơi button opens full-screen player list
- cards use Mở rộng / Thu gọn consistently
- touch targets remain large
- numeric inputs remain simple
- status/level labels are user-readable

If changing protected runtime layout or scheduling flow, ask owner unless explicitly requested.

Prefer compact operational UI over decorative or generic admin dashboard UI.
```
