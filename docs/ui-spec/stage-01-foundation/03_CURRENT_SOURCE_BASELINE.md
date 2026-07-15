# Current Source Baseline

## 1. Nền tảng kỹ thuật đã xác nhận

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 3.4
- TanStack Query
- Zustand
- Framer Motion
- Lucide React
- Prisma
- PostgreSQL

Không thay đổi stack trong Stage 1.

## 2. Các foundation hiện có

### Theme và tokens

- `src/app/globals.css`
- `tailwind.config.ts`
- Dark mode dùng class strategy
- Đã có các CSS variables:
  - background
  - foreground
  - card
  - popover
  - primary
  - secondary
  - muted
  - accent
  - destructive
  - border
  - input
  - ring
  - surface
  - success
  - danger
  - warning
  - info
  - inventory

### Shared components hiện có

- `src/components/ui/button.tsx`
- `src/components/ui/page-layout.tsx`
- `src/components/ui/theme-toggle.tsx`
- `src/components/ui/fullscreen-toggle.tsx`
- `src/components/ui/pagination-controls.tsx`
- `src/components/app-shell.tsx`

### Domain UI hiện có

- Dashboard
- Finance
- Inventory
- Schedule
- Session detail
- Runtime
- Court cards
- Next match cards
- Player components
- Settings
- Users

## 3. Baseline issues cần xử lý trong Stage 1

### 3.1 Tokens chưa hoàn thiện

- `inventory` đang trùng vai trò với `info`
- Radius có nhiều nguồn (`--radius` và Tailwind values)
- Chưa có token rõ cho text hierarchy
- Chưa có token cho focus/disabled/overlay
- Chưa có motion token
- Chưa có z-index scale
- Một số màu raw rgba vẫn tồn tại trong globals

### 3.2 Dark mode

- Nền có radial gradient cyan/purple tạo cảm giác decorative mạnh
- Primary dark khá sáng và có nguy cơ neon
- Border dark hơi chìm ở một số surface
- Surface hierarchy cần rõ hơn

### 3.3 Primitive coverage

Hiện mới thấy primitive dùng chung ở mức hạn chế. Nhiều input/select/card/badge có khả năng đang được viết trực tiếp trong domain components.

Stage 1 cần chuẩn hóa primitive trước khi sửa từng màn hình.

### 3.4 Page consistency

`PageLayout` đã tồn tại nhưng cần audit:

- Page padding
- Max width
- Section spacing
- Responsive behavior
- Header placement

## 4. Baseline commands

AI phải chạy:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Nếu baseline đã lỗi trước khi chỉnh sửa, phải ghi lại lỗi trước khi tiếp tục.
