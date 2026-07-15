# Non-negotiable Constraints

## 1. Nguyên tắc cao nhất

Stage 1 chỉ refactor **presentation layer**.

Mọi hành vi hiện tại phải giữ nguyên.

## 2. Tuyệt đối không thay đổi

### 2.1 Dữ liệu và backend

- `prisma/schema.prisma`
- Manual migrations
- Database table, column, relation hoặc constraint
- API request/response contract
- API route
- Authentication
- Authorization
- Role permissions
- Repository query
- Service calculation
- Cache semantics

### 2.2 Nghiệp vụ

- Tạo ngày chơi
- Tạo ca chơi
- Thêm/sửa/xóa người chơi
- Điều phối sân
- Xếp trận tự động
- Xếp trận thủ công
- Thứ tự hàng chờ
- Runtime status
- Start/end match
- Swap pair
- Apply match
- Kết thúc ca
- Tính doanh thu
- Tính chi phí
- Tính lợi nhuận
- Thanh toán
- Tồn kho
- Nhập/xuất/hao cầu
- Permission matrix

### 2.3 Kiến trúc logic

Không sửa nội dung logic trong:

- `src/repositories/**`
- `src/services/**`
- `src/app/api/**`
- `src/lib/badminton-store.ts`
- `src/lib/finance-calculation.ts`
- Runtime synchronization/hydration
- Domain types nếu việc sửa làm thay đổi contract

## 3. Không được tự ý

- Đổi route
- Đổi query key
- Đổi hook signature
- Đổi component callback semantics
- Đổi payload submit
- Đổi default values nghiệp vụ
- Đổi validation
- Xóa button/action
- Ẩn dữ liệu nghiệp vụ
- Đổi tên entity trong code
- Thêm library UI nặng
- Thêm chart library mới
- Chuyển toàn bộ framework hoặc styling solution

## 4. Khi nào phải dừng

AI phải dừng và báo cáo nếu:

- Một thay đổi giao diện yêu cầu sửa API
- Component hiện tại gắn chặt với runtime logic và không thể tách an toàn
- Không xác định được một handler có tác dụng gì
- Phát hiện code ngoài UI đang lỗi
- Thay đổi dự kiến có thể làm khác payload hoặc state transition
- Build lỗi do vấn đề có sẵn không liên quan

## 5. Quy tắc bảo toàn

Sau mỗi task, phải xác nhận:

- Props public không đổi, trừ khi chỉ bổ sung optional presentation prop
- Handler được truyền nguyên vẹn
- Event flow giữ nguyên
- API calls giữ nguyên
- Data mapping giữ nguyên
- Permission checks giữ nguyên
- Route giữ nguyên
