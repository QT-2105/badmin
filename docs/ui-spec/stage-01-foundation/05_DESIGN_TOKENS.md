# Design Tokens Specification

## 1. Nguyên tắc

- Token là nguồn màu và kích thước duy nhất.
- Component không hard-code hex/rgb/hsl nếu token phù hợp đã tồn tại.
- Domain-specific color không được tạo nếu semantic token đã đủ.
- Token phải dùng được trong cả Tailwind và CSS variables.

## 2. Color token model

### 2.1 Core surfaces

```text
--background
--surface
--surface-subtle
--surface-elevated
--surface-hover
--popover
--overlay
```

### 2.2 Text

```text
--text-primary
--text-secondary
--text-muted
--text-disabled
--text-inverse
```

Có thể map tương thích với biến cũ:

```text
--foreground
--muted-foreground
```

Không bắt buộc đổi toàn bộ class ngay nếu gây rủi ro. Có thể alias.

### 2.3 Borders and controls

```text
--border
--border-strong
--input
--input-hover
--ring
--focus-ring
```

### 2.4 Brand and semantics

```text
--primary
--primary-hover
--primary-soft
--primary-foreground

--success
--success-soft
--success-foreground

--warning
--warning-soft
--warning-foreground

--danger
--danger-soft
--danger-foreground

--info
--info-soft
--info-foreground
```

`inventory` không phải semantic token chung. Trong Stage 1:

- Không xóa ngay nếu code đang dùng.
- Alias `inventory` sang `info`.
- Đánh dấu deprecated cho stage sau.

## 3. Light palette target

Giá trị có thể điều chỉnh nhỏ để phù hợp source, nhưng phải giữ vai trò:

```css
:root {
  --background: 214 40% 98%;
  --surface: 0 0% 100%;
  --surface-subtle: 210 33% 96%;
  --surface-elevated: 0 0% 100%;
  --surface-hover: 210 29% 94%;

  --text-primary: 222 47% 11%;
  --text-secondary: 215 25% 27%;
  --text-muted: 215 16% 47%;
  --text-disabled: 215 16% 65%;

  --border: 214 25% 88%;
  --border-strong: 214 20% 78%;

  --primary: 190 90% 36%;
  --primary-hover: 191 84% 29%;
  --primary-soft: 187 85% 94%;

  --success: 151 60% 34%;
  --success-soft: 145 70% 94%;

  --warning: 32 88% 44%;
  --warning-soft: 43 100% 94%;

  --danger: 0 72% 51%;
  --danger-soft: 0 86% 97%;

  --info: 199 89% 40%;
  --info-soft: 199 90% 95%;
}
```

## 4. Dark palette target

```css
.dark {
  --background: 222 45% 6%;
  --surface: 222 35% 9%;
  --surface-subtle: 220 28% 12%;
  --surface-elevated: 220 27% 14%;
  --surface-hover: 220 25% 17%;

  --text-primary: 210 40% 96%;
  --text-secondary: 214 32% 85%;
  --text-muted: 215 20% 65%;
  --text-disabled: 215 15% 45%;

  --border: 218 22% 18%;
  --border-strong: 217 20% 27%;

  --primary: 187 72% 48%;
  --primary-hover: 187 76% 56%;
  --primary-soft: 188 68% 14%;

  --success: 153 58% 56%;
  --success-soft: 153 55% 13%;

  --warning: 43 90% 60%;
  --warning-soft: 43 65% 14%;

  --danger: 355 82% 68%;
  --danger-soft: 355 55% 15%;

  --info: 195 78% 59%;
  --info-soft: 195 60% 14%;
}
```

Không dùng purple gradient trên nền app mặc định trong Stage 1.

## 5. Spacing scale

Chỉ dùng scale:

```text
0
1 = 4px
2 = 8px
3 = 12px
4 = 16px
5 = 20px
6 = 24px
8 = 32px
10 = 40px
12 = 48px
16 = 64px
```

Các giá trị khác chỉ dùng khi có lý do kỹ thuật rõ ràng.

## 6. Radius scale

```text
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

Mapping:

- Input/Button: md
- Small badge: sm/full
- Card/Section: lg
- Modal/Drawer: xl

Loại bỏ xung đột giữa `--radius: 1.125rem` và Tailwind radius hiện tại.

## 7. Shadow scale

```text
--shadow-xs: 0 1px 2px rgba(...)
--shadow-sm: 0 2px 8px rgba(...)
--shadow-md: 0 12px 32px rgba(...)
```

Usage:

- Regular surface: none hoặc xs
- Dropdown/popover: sm
- Modal/drawer: md

Không dùng shadow cho mọi card.

## 8. Control size

```text
--control-sm: 32px
--control-md: 40px
--control-lg: 44px
```

## 9. Motion tokens

```text
--duration-fast: 120ms
--duration-normal: 180ms
--duration-slow: 240ms

--ease-standard: cubic-bezier(0.2, 0, 0, 1)
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1)
```

Tôn trọng `prefers-reduced-motion`.

## 10. Z-index scale

```text
base: 0
sticky: 20
dropdown: 40
overlay: 50
modal: 60
toast: 70
```
