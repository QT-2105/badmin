# Stage 01 — Goals and Expected Outcome

## 1. Bối cảnh sản phẩm

`badmin` là hệ thống quản lý vận hành câu lạc bộ cầu lông. Người dùng chính:

- Chủ câu lạc bộ
- Người quản lý
- Nhân viên điều phối
- Người phụ trách tài chính và kho

Đây là ứng dụng vận hành dữ liệu, không phải landing page hoặc website quảng cáo.

## 2. Định hướng thiết kế

Foundation phải hỗ trợ một sản phẩm có đặc tính:

- Chuyên nghiệp
- Hiện đại
- Dễ quét dữ liệu
- Thao tác nhanh
- Mật độ thông tin hợp lý
- Ít gây mỏi mắt
- Phù hợp desktop và tablet
- Light/Dark mode đồng nhất
- Dễ mở rộng về sau

Phong cách mong muốn:

- Operational SaaS
- Enterprise dashboard
- Clean and restrained
- Data-first
- Consistent

Không sao chép trực tiếp Linear, Stripe, Vercel, Supabase hoặc GitHub. Chỉ tham khảo tư duy về hierarchy, consistency và restraint.

## 3. Mục tiêu cụ thể

### 3.1 Token hóa toàn bộ nền tảng

Xây dựng token rõ ràng cho:

- Background
- Surface
- Text
- Border
- Primary
- Semantic colors
- Spacing
- Radius
- Shadow
- Typography
- Motion
- Z-index

### 3.2 Chuẩn hóa Light/Dark mode

- Không có panel dark trong light mode
- Không có màu cyan neon quá mạnh trong dark mode
- Surface phân tầng rõ
- Text muted vẫn đủ tương phản
- Focus state giống nhau về hành vi

### 3.3 Chuẩn hóa primitive components

Các component nền tảng phải nhất quán:

- Button
- Input
- Select
- Textarea
- Checkbox
- Switch
- Badge
- Card/Surface
- Separator
- Tooltip
- Dialog
- Drawer/Sheet
- Skeleton
- Empty state

Chỉ tạo component thật sự cần cho nền móng. Không tạo abstraction dư thừa.

### 3.4 Chuẩn hóa layout dùng chung

- Page container
- Page header
- Section header
- App shell
- Sidebar item
- Top-level spacing
- Mobile/tablet behavior

## 4. Kết quả mong đợi sau Stage 1

Sau khi hoàn thành:

- Giao diện có thể chưa thay đổi mạnh về bố cục từng trang.
- Các màu, typography, border, radius và controls đã dùng chung một hệ thống.
- Light/Dark mode không còn lệch ngôn ngữ thiết kế.
- Các stage sau có thể tái cấu trúc màn hình bằng component nền tảng ổn định.
- Build, type-check và lint phải pass.
- Không có thay đổi hành vi nghiệp vụ.

## 5. Không thuộc phạm vi Stage 1

- Thay đổi KPI Dashboard
- Đổi layout Court/Queue/Next Match
- Chuyển form nghiệp vụ sang drawer hàng loạt
- Chuyển table sang card list
- Thay đổi nội dung, dữ liệu, label nghiệp vụ lớn
- Thay đổi luồng điều hướng
- Thêm tính năng mới
