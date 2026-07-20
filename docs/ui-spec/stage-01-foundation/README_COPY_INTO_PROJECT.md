# Cách đưa bộ tài liệu vào project

Copy toàn bộ thư mục này vào:

```text
docs/ui-spec/stage-01-foundation/
```

Cấu trúc:

```text
docs/
└── ui-spec/
    └── stage-01-foundation/
        ├── 00_README.md
        ├── 01_STAGE_GOALS.md
        ├── 02_NON_NEGOTIABLE_CONSTRAINTS.md
        ├── 03_CURRENT_SOURCE_BASELINE.md
        ├── 04_DESIGN_PRINCIPLES.md
        ├── 05_DESIGN_TOKENS.md
        ├── 06_THEME_SYSTEM.md
        ├── 07_TYPOGRAPHY_SYSTEM.md
        ├── 08_FOUNDATION_COMPONENTS.md
        ├── 09_APP_SHELL_AND_NAVIGATION.md
        ├── 10_FILE_SCOPE_AND_CHANGE_POLICY.md
        ├── 11_IMPLEMENTATION_TASKS.md
        ├── 12_QUALITY_AND_ACCEPTANCE.md
        ├── 13_AI_EXECUTION_INSTRUCTIONS.md
        └── 15_COMPLETION_REPORT.md
```

Prompt gửi Codex:

```text
Đọc docs/ui-spec/stage-01-foundation/00_README.md và toàn bộ tài liệu được dẫn chiếu theo đúng thứ tự.

Thực hiện đúng Stage 1. Chưa sửa code trước khi hoàn tất baseline audit và implementation plan. Không thay đổi business logic, API, database, Prisma, repositories, services, hooks nghiệp vụ, Zustand runtime, route hoặc permissions.

Chỉ thực hiện Task 0 đến Task 9. Sau khi xuất Stage 01 Completion Report thì dừng.
```
