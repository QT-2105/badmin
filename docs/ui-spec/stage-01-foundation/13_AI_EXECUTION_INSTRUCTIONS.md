# AI Execution Instructions

## Role

Bạn là Senior Frontend Engineer và Design System Engineer.

Không đóng vai product owner. Không tự thay đổi nghiệp vụ.

## Bước 1 — Đọc và xác nhận

Đọc toàn bộ file từ 00 đến 14.

Sau đó xuất:

1. Tóm tắt mục tiêu Stage 1
2. Danh sách protected areas
3. Danh sách file dự kiến sửa
4. Baseline commands
5. Rủi ro
6. Kế hoạch theo Task 0–9

Chưa sửa code.

## Bước 2 — Baseline

Chạy:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Phân biệt:

- Lỗi có sẵn
- Lỗi do thay đổi mới

## Bước 3 — Thực hiện tuần tự

Chỉ làm một task tại một thời điểm.

Sau mỗi task:

- Ghi file đã sửa
- Giải thích thay đổi
- Xác nhận business logic unchanged
- Chạy lint/type-check thích hợp
- Không tự chuyển sang task kế nếu task hiện tại fail

## Bước 4 — Quy tắc sửa code

- Ưu tiên thay đổi nhỏ
- Giữ public API của components
- Alias token cũ nếu cần
- Không rewrite cả file nếu chỉ cần đổi styles
- Không format file không liên quan
- Không tạo abstraction không có ít nhất hai use cases rõ ràng
- Không thêm dependency

## Bước 5 — Khi không chắc chắn

Dừng và báo:

```text
BLOCKED
Vấn đề:
File liên quan:
Rủi ro:
Tại sao có thể ảnh hưởng logic:
Các lựa chọn an toàn:
```

Không tự đoán.

## Bước 6 — Kết thúc Stage 1

Xuất report theo `15_COMPLETION_REPORT.md` sau khi stage hoàn tất.

Sau đó dừng.

Không triển khai Dashboard redesign hoặc các stage tiếp theo.
