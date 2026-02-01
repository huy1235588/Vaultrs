# Proposal: Cross-Vault Reference (Liên kết chéo Vault)

## Summary

Thêm loại field mới `Relation` cho phép liên kết Entry giữa các Vault khác nhau, hỗ trợ navigation và resolve thông tin liên kết.

## Motivation

### Problem

Hiện tại, mỗi Vault là một silo độc lập. Người dùng không thể tạo mối quan hệ giữa các Entry ở các Vault khác nhau. Ví dụ:

-   Vault **Movies** không thể liên kết đến Vault **Directors**
-   Vault **Books** không thể liên kết đến Vault **Authors**
-   Vault **Projects** không thể liên kết đến Vault **Team Members**

### Solution

Thêm field type `Relation` cho phép:

1. Định nghĩa liên kết đến một Vault đích cụ thể
2. Chọn Entry từ Vault đích khi nhập liệu
3. Tự động resolve thông tin Entry được liên kết
4. Navigate trực tiếp đến Entry được liên kết

## User Stories

### US-1: Schema Designer

> Là một schema designer, tôi muốn thêm field Relation vào Vault Movies để liên kết đến Vault Directors.

### US-2: Data Entry User

> Là một data entry user, khi tạo Entry "Inception" trong Vault Movies, tôi muốn có thể tìm kiếm và chọn "Christopher Nolan" từ Vault Directors.

### US-3: Data Consumer

> Là một data consumer, khi xem Entry "Inception", tôi muốn thấy thông tin cơ bản của Director đã liên kết và có thể nhấp để xem chi tiết.

### US-4: Data Maintainer

> Là một data maintainer, khi Entry "Christopher Nolan" bị xóa, tôi muốn hệ thống xử lý gracefully và không làm hỏng Entry "Inception".

## Scope

### In Scope

-   [ ] Thêm field type `Relation` vào hệ thống field definitions
-   [ ] API để query/search Entry từ Vault khác
-   [ ] Lưu trữ reference trong metadata (Entry ID + Vault ID)
-   [ ] Resolve linked Entry khi fetch data
-   [ ] UI component để chọn Entry từ Vault khác
-   [ ] Navigation/hyperlink đến linked Entry
-   [ ] Xử lý cascading delete (soft reference)

### Out of Scope

-   Bidirectional relations (backlinks tự động)
-   Many-to-many relations (chỉ hỗ trợ single reference)
-   Cross-database relations (chỉ trong cùng SQLite file)
-   Relation constraints/validation rules phức tạp

## Impact Analysis

### Database

-   Không cần thêm table mới
-   Mở rộng `field_type` enum để thêm `relation`
-   Mở rộng `FieldOptions` để lưu `target_vault_id`
-   Metadata lưu reference dạng JSON object

### Backend (Rust)

-   Cập nhật `FieldType` enum
-   Cập nhật `FieldOptions` struct
-   Thêm service để resolve relations
-   Thêm API endpoint để query entry từ vault khác

### Frontend (React)

-   Thêm component `RelationFieldEditor` (với search/select)
-   Thêm component `RelationFieldDisplay` (với hyperlink)
-   Cập nhật form logic để handle relation field

## Risks & Mitigations

| Risk                                       | Impact | Mitigation                                             |
| ------------------------------------------ | ------ | ------------------------------------------------------ |
| Referenced Entry bị xóa → dangling pointer | High   | Soft reference: kiểm tra tồn tại khi resolve           |
| Target Vault bị xóa → orphan relations     | Medium | Validate target vault khi tạo field, warning khi xóa   |
| Performance khi resolve nhiều relations    | Medium | Batch resolve, lazy loading, optional eager fetch flag |
| Circular references (A → B → A)            | Low    | Cho phép, không tự động resolve recursive              |

## Success Metrics

-   Field type `Relation` hoạt động đúng như các field types khác
-   Resolve linked Entry trong < 50ms cho single relation
-   Graceful handling khi linked Entry không tồn tại
-   Navigation hoạt động smooth, không reload page

## Timeline Estimate

-   Backend changes: 2-3 days
-   Frontend changes: 2-3 days
-   Testing & edge cases: 1-2 days
-   **Total: 5-8 days**

---

_Created: 2026-02-01_
