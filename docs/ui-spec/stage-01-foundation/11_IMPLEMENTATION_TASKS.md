# Stage 01 Implementation Tasks

AI chỉ thực hiện theo thứ tự. Không nhảy task.

## Task 0 — Baseline audit

### Việc làm

- Chạy npm ci
- Chạy lint
- Chạy type-check
- Chạy build
- Chạy guard DB schema
- Ghi lỗi baseline nếu có
- Liệt kê hard-coded colors/radius/shadows trong UI

### Không sửa code

### Done khi

- Có báo cáo baseline
- Có file list dự kiến thay đổi
- Có risk assessment

---

## Task 1 — Normalize design tokens

### File chính

- `src/app/globals.css`
- `tailwind.config.ts`

### Việc làm

- Bổ sung core surface tokens
- Bổ sung text tokens
- Bổ sung border strong
- Bổ sung primary soft/hover
- Chuẩn hóa semantic foreground
- Alias inventory sang info
- Chuẩn hóa radius scale
- Chuẩn hóa shadow scale
- Bổ sung motion và z-index tokens
- Loại bỏ global decorative gradient
- Sửa selection và scrollbar theo theme

### Không làm

- Không đổi component layout
- Không thay domain colors hàng loạt nếu chưa cần

### Done khi

- Tailwind build được
- Light/Dark token đầy đủ
- Không có token xung đột

---

## Task 2 — Typography foundation

### File chính

- `src/app/layout.tsx`
- `src/app/globals.css`
- Tailwind config nếu cần

### Việc làm

- Xác nhận Inter load đúng
- Chuẩn hóa typography utilities
- Thêm tabular number utility
- Chuẩn hóa base body text
- Không đổi nội dung

### Done khi

- Không có FOUT/hydration issue
- Vietnamese render tốt
- Typography utilities có thể dùng chung

---

## Task 3 — Button foundation

### File chính

- `src/components/ui/button.tsx`

### Việc làm

- Chuẩn hóa variants
- Chuẩn hóa sizes
- Focus-visible
- Loading behavior nếu component đã hỗ trợ
- Disabled contrast
- Icon spacing
- No-wrap

### Done khi

- Existing call sites vẫn type-safe
- Không đổi click behavior
- Light/Dark pass

---

## Task 4 — Form primitives

### Việc làm

Tạo hoặc chuẩn hóa:

- Input
- Select
- Textarea
- Checkbox
- Switch
- Label
- Form message

### Quy tắc

- Native semantics
- 40px default control height
- Shared focus/error/disabled style
- Không migrate toàn bộ form domain trong một lần

### Done khi

- Có usage example
- Components không chứa business logic
- TypeScript pass

---

## Task 5 — Surface, Badge and feedback primitives

### Việc làm

- Surface/Card
- StatusBadge
- Skeleton
- EmptyState
- Separator
- Optional compact alert

### Done khi

- Semantic variants thống nhất
- Không có module-specific color variant
- Light/Dark pass

---

## Task 6 — Page layout primitives

### File chính

- `src/components/ui/page-layout.tsx`
- Tạo PageHeader/SectionHeader nếu cần

### Việc làm

- Chuẩn page padding
- Responsive spacing
- Full-width operational mode
- Shared header structure
- Không migrate toàn bộ page sâu

### Done khi

- Existing pages không vỡ
- Nested padding được kiểm soát

---

## Task 7 — App shell and sidebar foundation

### File chính

- `src/components/app-shell.tsx`

### Việc làm

- Áp token mới
- Active/hover/focus
- Group label nếu an toàn
- Responsive
- Footer/profile polish
- Không đổi route/auth/permission

### Done khi

- Tất cả nav vẫn hoạt động
- Active state đúng
- Tablet/mobile không mất menu

---

## Task 8 — Safe token adoption

### Việc làm

Rà các domain component và chỉ thay:

- Hard-coded background
- Hard-coded border
- Hard-coded radius
- Hard-coded shadow
- Repeated button styles

Không đổi:

- Layout lớn
- Data grouping
- Handler
- Workflow

### Done khi

- Hard-coded UI primitives giảm rõ
- Không có visual regression nghiêm trọng
- Build pass

---

## Task 9 — Foundation QA

### Kiểm tra

- Light mode
- Dark mode
- Dashboard
- Schedule
- Session detail
- Runtime
- Finance
- Inventory
- Users
- Settings
- 1440px
- 1280px
- Tablet landscape
- Tablet portrait
- Mobile smoke test

### Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

### Done khi

- Acceptance checklist pass
- Có completion report
- AI dừng, không sang Stage 2
