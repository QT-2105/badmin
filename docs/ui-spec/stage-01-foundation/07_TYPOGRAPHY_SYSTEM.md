# Typography System

## 1. Font family

Giữ Inter nếu project đã khai báo và load đúng.

Không thêm font thứ ba.

`font-display` chỉ được dùng khi đã xác định rõ mục đích. Không dùng font display khác nhau cho từng module.

## 2. Type scale

### Page title

```text
Desktop: 30–32px
Tablet: 26–28px
Weight: 700
Line-height: 1.2
Letter-spacing: -0.02em
```

### Section title

```text
18–20px
Weight: 600
Line-height: 1.35
```

### Subsection/card title

```text
14px
Weight: 600
Line-height: 1.4
```

### Body

```text
14px
Weight: 400
Line-height: 1.55
```

### Label

```text
12–13px
Weight: 500
Line-height: 1.4
```

### Caption/helper

```text
12px
Weight: 400
Line-height: 1.45
```

### KPI value

```text
30–34px
Weight: 700
Line-height: 1.15
font-variant-numeric: tabular-nums
```

### Table

```text
Header: 12–13px / 600
Cell: 13–14px / 400–500
```

## 3. Numeric typography

Áp dụng `tabular-nums` cho:

- Tiền
- Phần trăm
- Số lượng
- Thời gian
- KPI
- Finance table
- Inventory table
- Runtime timer

Không bắt buộc dùng monospace.

## 4. Hierarchy rules

- Page title không cùng size với section title
- Label không dùng uppercase toàn bộ trừ nhóm navigation nhỏ
- Description trang tối đa một câu ngắn
- Không dùng eyebrow tiếng Anh trong ứng dụng tiếng Việt
- Không dùng text muted cho dữ liệu quan trọng
- Không dùng font-bold quá nhiều

## 5. Truncation and wrapping

- Button text không được xuống hai dòng
- Table header ưu tiên một dòng
- Tên người dùng/người chơi có thể truncate với tooltip
- Mô tả dài phải wrap tự nhiên
- Không dùng `truncate` nếu người dùng cần đọc đầy đủ mà không có cách mở rộng

## 6. Implementation

Có thể tạo utility classes trong `@layer utilities`:

```css
.text-page-title {}
.text-section-title {}
.text-card-title {}
.text-body {}
.text-label {}
.text-caption {}
.text-kpi {}
.numeric-tabular {}
```

Hoặc dùng component variants hiện có. Không tạo hệ CSS song song phức tạp.
