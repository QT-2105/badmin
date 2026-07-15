# File Scope and Change Policy

## 1. File được phép sửa trong Stage 1

### Foundation

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/app/layout.tsx` — chỉ typography/theme wiring
- `src/app/providers.tsx` — chỉ khi cần cho theme hiện có
- `src/components/ui/**`
- `src/components/app-shell.tsx`

### Domain UI

Được phép sửa tối thiểu để thay class hard-code bằng token hoặc shared primitive:

- `src/components/dashboard/**`
- `src/components/finance/**`
- `src/components/inventory/**`
- `src/components/schedule/**`
- `src/components/settings/**`
- `src/components/users/**`
- `src/components/cards/**`
- `src/components/sections/**`
- `src/components/player/**`

Điều kiện:

- Không đổi behavior
- Không đổi props contract nếu không cần
- Không thay layout nghiệp vụ lớn

## 2. File chỉ đọc, không sửa

- `src/repositories/**`
- `src/services/**`
- `src/app/api/**`
- `src/lib/badminton-store.ts`
- `src/lib/finance-calculation.ts`
- `prisma/**`
- `middleware.ts`
- `rules/**`
- `docs/00-system-constitution.md` đến `docs/20-glossary.md`

## 3. Hooks

`src/hooks/**` mặc định không sửa.

Chỉ được sửa import/type presentation nếu build bắt buộc và không đổi behavior.

## 4. Types

`src/types/**` không sửa trừ khi thêm type thuần presentation không ảnh hưởng domain.

Ưu tiên định nghĩa UI types cạnh component.

## 5. Dependencies

Không thêm dependency mới nếu có thể triển khai bằng:

- React
- Tailwind
- Lucide
- Framer Motion hiện có
- Utility hiện có

Nếu thật sự cần dependency, phải dừng và xin xác nhận.

## 6. Quy tắc diff

Mỗi task phải có diff nhỏ, tập trung.

Không:

- Format toàn repository
- Rename hàng loạt
- Move folder hàng loạt
- Rewrite domain component không liên quan
- Thay toàn bộ class trong một commit không kiểm soát

## 7. Backward compatibility

Có thể alias token cũ sang token mới trong Stage 1 để giảm rủi ro.

Ví dụ:

```css
--card: var(--surface);
--card-foreground: var(--text-primary);
```

Sau Stage 1 mới loại bỏ alias nếu cần.
