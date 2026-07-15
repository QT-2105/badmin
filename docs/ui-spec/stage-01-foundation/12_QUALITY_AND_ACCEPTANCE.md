# Quality and Acceptance Criteria

## 1. Functional acceptance

- Tất cả route mở được
- Navigation hoạt động
- Theme toggle hoạt động
- Form submit vẫn gọi handler cũ
- Button action vẫn hoạt động
- Permission vẫn áp dụng
- Runtime flow không đổi
- API payload không đổi
- Không có console error mới

## 2. Visual acceptance

### Light mode

- Không có panel sai theme
- Surface phân tầng rõ
- Border nhẹ
- Focus rõ
- Disabled đọc được
- Không có màu neon

### Dark mode

- Background/surface/elevated phân biệt
- Primary không quá sáng
- Muted text đủ tương phản
- Border không mất
- Semantic states rõ

## 3. Consistency acceptance

- Button cùng variant có cùng style
- Input cùng state có cùng style
- Card cùng loại có cùng radius/border
- Status badge dùng semantic mapping
- Page padding nhất quán
- Typography hierarchy dùng chung

## 4. Accessibility acceptance

- Keyboard focus nhìn thấy
- Icon-only button có label
- Form control có label
- Touch target đủ lớn
- Không truyền tải trạng thái chỉ bằng màu
- Reduced motion được tôn trọng
- Contrast cơ bản đạt WCAG AA cho body text

## 5. Responsive acceptance

### Desktop 1440+

- Sidebar và content cân đối
- Không max-width quá hẹp
- Table không vỡ

### Laptop 1280

- Không overflow page ngoài ý muốn
- Controls không wrap xấu

### Tablet landscape/portrait

- Sidebar usable
- Control dễ chạm
- Page padding hợp lý
- Runtime không bị khóa thao tác

### Mobile smoke test

- Navigation mở được
- Không mất action chính
- Form cơ bản dùng được
- Không có horizontal page overflow toàn cục

## 6. Code acceptance

- Không dùng `any` mới không cần thiết
- Không duplicate utility lớn
- Không thêm dependency
- Không sửa protected modules
- Không thay business contract
- Không có unused exports
- Lint pass
- Type-check pass
- Build pass

## 7. Regression guard

AI phải so sánh trước/sau:

- Screenshot hoặc mô tả screen state
- Component public props
- Handler signatures
- Route map
- Protected file diff

Nếu protected file thay đổi, Stage 1 fail trừ khi thay đổi chỉ là import/type presentation đã được giải thích.
