# Design Principles

## 1. Operation first

Mỗi quyết định giao diện phải phục vụ thao tác vận hành.

Ưu tiên:

- Thấy trạng thái nhanh
- Nhấn đúng hành động nhanh
- Không phải đọc đoạn dài
- Không phải ghi nhớ cách dùng khác nhau giữa các trang

## 2. Data before decoration

Không dùng màu, gradient, icon, shadow hoặc animation chỉ để trang trí.

Dữ liệu quan trọng phải nổi bật bằng:

1. Typography
2. Position
3. Spacing
4. Contrast
5. Semantic color khi thật sự cần

## 3. One product, one language

Mọi module phải dùng chung:

- Page spacing
- Heading hierarchy
- Button variants
- Input height
- Card radius
- Status badge
- Surface hierarchy
- Focus behavior

## 4. Neutral by default

Phần lớn UI dùng neutral.

Semantic color chỉ dùng khi màu đó mang ý nghĩa:

- Success
- Warning
- Danger
- Info
- Primary interaction

## 5. View first, edit on demand

Stage 1 chưa triển khai toàn bộ pattern này, nhưng foundation phải hỗ trợ:

- Read-only content
- Edit mode
- Drawer/dialog
- Action menu

Không thiết kế primitive khiến mọi dữ liệu buộc phải ở dạng input.

## 6. Consistent density

Hệ thống là ứng dụng vận hành, không phải landing page.

- Không dùng H1 quá lớn
- Không tạo card quá cao
- Không có khoảng trắng vô nghĩa
- Không làm controls nhỏ đến mức khó thao tác

## 7. Tablet-aware

Tablet là thiết bị ưu tiên cao.

Foundation phải bảo đảm:

- Control tối thiểu 40px
- Focus/touch rõ
- Grid co giãn
- Sidebar có collapsed/mobile mode
- Horizontal scroll có kiểm soát

## 8. Accessibility is default

Accessibility không phải polish cuối:

- Focus-visible
- Label
- Contrast
- Keyboard
- Reduced motion
- Semantic HTML

## 9. Minimal motion

Motion chỉ dùng để:

- Xác nhận phản hồi
- Giải thích thay đổi trạng thái
- Chuyển drawer/dialog
- Làm rõ hover/focus

Không dùng bounce, parallax hoặc animation kéo dài.
