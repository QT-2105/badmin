# Sprint 11.1 Current Audit

Current app shell:

- Fixed desktop sidebar.
- Collapsible state persisted in localStorage.
- Sticky mobile top nav with horizontal scroll.
- Current root navigation: Dashboard, Lịch chơi, Thu chi, Kho cầu, Người dùng, Cài đặt.
- Users navigation is an existing permission-guarded administrator capability from Stage 09, not a new Stage 11 route.

Risks:

- Mobile nav overflow must remain controlled.
- Focus states on collapsed sidebar controls require review.
- Page shell min-width usage must not create global overflow.
