# Theme System

## 1. Theme architecture

Giữ class-based dark mode hiện tại:

```ts
darkMode: ['class']
```

Không đổi sang media-only hoặc library theme mới.

## 2. Theme responsibilities

Theme chỉ quyết định:

- Color tokens
- Surface hierarchy
- Border
- Shadow opacity
- Focus ring
- Selection
- Scrollbar

Theme không thay đổi:

- Component layout
- Spacing
- Data hierarchy
- Business state

## 3. Light mode requirements

- Background sáng nhưng không trắng tuyệt đối
- Surface chính trắng
- Border đủ nhìn nhưng nhẹ
- Primary không quá bão hòa
- Input rõ ràng
- Disabled vẫn đọc được
- Không có component nền đen trừ nội dung đặc thù thật sự
- Không dùng nhiều pastel khác nhau chỉ để phân loại card

## 4. Dark mode requirements

- Có tối thiểu ba cấp:
  1. Background
  2. Surface
  3. Elevated surface
- Không dùng cùng một màu gần đen cho toàn bộ
- Primary giảm neon
- Border đủ phân tách
- Muted text không quá tối
- Semantic color không phát sáng quá mức
- Không dùng radial gradient purple/cyan làm nền mặc định app

## 5. Body and html

`html` và `body` phải dùng background token rõ ràng.

Không để `body { background: transparent }` phụ thuộc vào gradient trên `html` nếu điều đó gây khó kiểm soát.

Khuyến nghị:

```css
html,
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

Nếu muốn texture/gradient, chỉ dùng tại màn cụ thể, không dùng global.

## 6. Selection

Selection phải đọc được ở cả Light/Dark.

Không hard-code `color: white` nếu nền selection ở light mode không đủ tương phản.

## 7. Scrollbar

Scrollbar custom chỉ áp dụng cho vùng runtime hoặc table cần thiết.

Không dùng màu dark hard-code cho scrollbar ở light mode.

Tạo token hoặc dùng `color-mix`/semantic variables.

## 8. Theme toggle

Theme toggle phải:

- Có aria-label
- Có tooltip nếu icon-only
- Có focus-visible
- Không gây layout shift
- Giữ theme khi reload theo behavior hiện có
- Không thay đổi logic provider hiện tại nếu đang hoạt động

## 9. Theme parity checklist

Một component chỉ được coi là hoàn thành khi:

- Text đọc được ở cả hai theme
- Border đọc được
- Hover rõ
- Focus rõ
- Disabled rõ
- Loading/empty rõ
- Semantic state không phụ thuộc riêng một theme
