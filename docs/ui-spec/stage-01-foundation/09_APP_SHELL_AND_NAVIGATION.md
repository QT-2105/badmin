# App Shell and Navigation Foundation

## 1. Mục tiêu

Chuẩn hóa `src/components/app-shell.tsx` về spacing, surface, active state và responsive mà không đổi route hoặc quyền truy cập.

## 2. Navigation grouping

Có thể hiển thị nhóm:

```text
TỔNG QUAN
Dashboard

VẬN HÀNH
Lịch chơi

TÀI CHÍNH
Thu chi
Kho cầu

HỆ THỐNG
Người dùng
Cài đặt
```

Chỉ áp dụng nếu không làm thay đổi permission filtering hiện tại.

Không thêm route Điều phối riêng.

## 3. Sidebar dimensions

```text
Expanded: 224–240px
Collapsed: 64–72px
Item height: 40–44px
Icon: 18px
Item gap: 4px
Horizontal padding: 12px
```

## 4. Active state

Light:

- Primary soft background
- Primary foreground
- Optional left indicator 2px

Dark:

- Primary soft background
- Border hoặc indicator nhẹ
- Không dùng neon fill

## 5. Hover and focus

- Hover dùng surface-hover
- Focus-visible rõ
- Active không phụ thuộc chỉ vào màu
- Icon và label căn giữa theo baseline

## 6. Footer/profile

Giữ thông tin và action hiện tại.

Giảm nested card/border nếu có.

Không thay đổi logout/auth behavior.

## 7. Responsive

### Desktop

- Sidebar fixed/sticky theo behavior hiện tại
- Main content không bị co quá hẹp

### Tablet

- Collapsed hoặc overlay
- Touch target ≥ 40px

### Mobile

- Drawer hoặc behavior hiện tại
- Không mất navigation item
- Escape/backdrop close nếu implementation hỗ trợ

## 8. Main content

- Background dùng token
- Page padding do PageLayout quản lý
- Không lặp padding ở AppShell và page
- Header/sidebar z-index theo scale

## 9. Brand/logo

Không thay logo hoặc branding data.

Chỉ chuẩn hóa:

- Kích thước
- Alignment
- Truncation
- Contrast
