# BADMIN — Stage 01 UI Foundation

## 1. Mục đích

Bộ tài liệu này là nguồn yêu cầu chính thức cho **Giai đoạn 1: UI Foundation** của project `badmin`.

Giai đoạn này chỉ xây dựng nền móng giao diện dùng chung:

- Design tokens
- Theme Light/Dark
- Typography
- Surface, border, radius và shadow
- Primitive UI components
- Page container và app shell
- Focus, disabled và accessibility nền tảng
- Quy tắc thực thi dành cho AI coding agent

Giai đoạn này **không redesign sâu từng màn hình nghiệp vụ**. Dashboard, Lịch chơi, Chi tiết ca, Điều phối, Thu chi, Kho cầu, Người dùng và Cài đặt chỉ được điều chỉnh tối thiểu khi cần để áp dụng foundation mà không phá giao diện.

## 2. Thứ tự AI bắt buộc phải đọc

1. `01_STAGE_GOALS.md`
2. `02_NON_NEGOTIABLE_CONSTRAINTS.md`
3. `03_CURRENT_SOURCE_BASELINE.md`
4. `04_DESIGN_PRINCIPLES.md`
5. `05_DESIGN_TOKENS.md`
6. `06_THEME_SYSTEM.md`
7. `07_TYPOGRAPHY_SYSTEM.md`
8. `08_FOUNDATION_COMPONENTS.md`
9. `09_APP_SHELL_AND_NAVIGATION.md`
10. `10_FILE_SCOPE_AND_CHANGE_POLICY.md`
11. `11_IMPLEMENTATION_TASKS.md`
12. `12_QUALITY_AND_ACCEPTANCE.md`
13. `13_AI_EXECUTION_INSTRUCTIONS.md`
14. `14_STAGE_COMPLETION_REPORT_TEMPLATE.md`

Không được chỉ đọc `11_IMPLEMENTATION_TASKS.md` rồi code ngay.

## 3. Quy trình thực thi

```text
Đọc tài liệu
→ Audit source hiện tại
→ Lập change plan theo task
→ Thực hiện từng task
→ Lint
→ Type-check
→ Build
→ Kiểm tra Light/Dark
→ Ghi báo cáo
→ Dừng ở cuối Stage 1
```

## 4. Điểm dừng bắt buộc

Sau khi hoàn thành Stage 1, AI phải dừng. Không được tự chuyển sang:

- Redesign Dashboard
- Redesign Điều phối
- Redesign Thu chi
- Redesign Kho cầu
- Redesign User
- Thay đổi layout nghiệp vụ từng màn hình

Các phần đó thuộc Stage sau.

## 5. Câu lệnh khởi động đề xuất

```text
Đọc toàn bộ tài liệu trong docs/ui-spec/stage-01-foundation theo thứ tự từ 00 đến 14.

Chưa sửa code ngay. Trước tiên:
1. Đối chiếu tài liệu với source hiện tại.
2. Liệt kê các file dự kiến thay đổi.
3. Xác định rủi ro có thể tác động business logic.
4. Lập kế hoạch thực hiện từng task trong 11_IMPLEMENTATION_TASKS.md.
5. Chỉ bắt đầu sau khi kế hoạch hoàn chỉnh.

Không thay đổi API, database, Prisma, repositories, services, hooks nghiệp vụ, Zustand runtime, route hoặc công thức tính toán.
```
