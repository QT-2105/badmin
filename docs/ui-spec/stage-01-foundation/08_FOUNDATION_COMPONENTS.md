# Foundation Components

## 1. Mục tiêu

Stage 1 chuẩn hóa primitive và shared layout components. Không redesign domain component sâu.

## 2. Button

File hiện có:

```text
src/components/ui/button.tsx
```

### Variants bắt buộc

- primary
- secondary
- outline
- ghost
- danger
- link

### Sizes

- sm: 32px
- md: 40px
- lg: 44px
- icon: tối thiểu 40×40 khi là action chính

### States

- default
- hover
- active
- focus-visible
- disabled
- loading

### Rules

- Không đổi callback behavior
- Không để text wrap
- Icon spacing thống nhất
- Danger fill chỉ dùng cho xác nhận cuối
- Icon-only có aria-label

## 3. Form controls

Tạo hoặc chuẩn hóa nếu chưa có:

- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `Switch`
- `FormLabel`
- `FormMessage`
- `FormDescription`

### Standard

- Height md: 40px
- Radius md
- Border token
- Focus ring token
- Disabled readable
- Error state semantic danger
- Label không phụ thuộc placeholder

Không thay thế native behavior bằng custom complex control nếu không cần.

## 4. Surface/Card

Tạo component hoặc convention:

- `Surface`
- `Section`
- `Card`

### Variants

- default
- subtle
- elevated
- interactive
- danger-soft

### Rules

- Regular card không shadow hoặc shadow-xs
- Radius lg
- Border mặc định
- Không cho phép arbitrary color variant theo module

## 5. Badge/StatusBadge

### Variants

- neutral
- primary
- success
- warning
- danger
- info

### Rules

- Badge không là button
- Height và padding thống nhất
- Có icon optional
- Không tạo màu riêng cho từng page

## 6. PageLayout

Audit component hiện có:

```text
src/components/ui/page-layout.tsx
```

Phải hỗ trợ:

- Page padding thống nhất
- Full-width operational layout
- Optional max-width
- Responsive spacing
- Không gây nested container sai

## 7. PageHeader

Tạo shared component nếu chưa có.

Props đề xuất:

```ts
type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  backAction?: React.ReactNode;
};
```

Không chứa business logic.

## 8. SectionHeader

Props:

```ts
type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};
```

## 9. Skeleton

Tạo primitive skeleton đơn giản:

- Text
- Card
- Row

Không thêm animation nặng.

Tôn trọng reduced motion.

## 10. EmptyState

Props đề xuất:

```ts
type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
};
```

## 11. Separator

Dùng border token. Không hard-code neutral shade.

## 12. Tooltip

Chỉ tạo nếu project đã có primitive phù hợp hoặc có thể triển khai nhẹ.

Không cài package lớn chỉ vì tooltip trong Stage 1.

Nếu chưa có, dùng accessible `title` tạm thời và ghi debt cho Stage 2.

## 13. Dialog/Drawer

Stage 1 chỉ chuẩn hóa wrappers nếu component đã tồn tại.

Không bắt buộc cài Radix hoặc UI library mới.

## 14. Không thuộc Stage 1

Không refactor sâu:

- CourtCard
- NextMatchCard
- Player team
- Finance voucher form
- Inventory movement form
- Permission matrix

Chỉ thay token/primitive nếu an toàn.
