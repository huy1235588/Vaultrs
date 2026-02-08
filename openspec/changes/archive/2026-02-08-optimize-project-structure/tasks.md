## 1. Backend — Dọn dẹp dead code & dependencies

- [x] 1.1 Xóa `AppState` struct không sử dụng trong `src-tauri/src/lib.rs`
- [x] 1.2 Xóa thư mục trống `src-tauri/src/link/`
- [x] 1.3 Loại bỏ `sea-orm-cli` khỏi `[dependencies]` trong `Cargo.toml`

## 2. Backend — Tạo core utility module

- [x] 2.1 Tạo file `src-tauri/src/core/utils.rs` với hàm `now_formatted() -> String`
- [x] 2.2 Thêm hàm `find_vault_or_error(conn, vault_id) -> AppResult<vault::Model>` vào `core/utils.rs`
- [x] 2.3 Export `utils` module trong `src-tauri/src/core/mod.rs`

## 3. Backend — Thống nhất naming & return types

- [x] 3.1 Đổi parameter `conn` thành `db` trong `src-tauri/src/commands/field_commands.rs`
- [x] 3.2 Thống nhất return type sang `AppResult<T>` trong `vault_commands.rs`
- [x] 3.3 Thống nhất return type sang `AppResult<T>` trong `entry_commands.rs`
- [x] 3.4 Thống nhất return type sang `AppResult<T>` trong `field_commands.rs`

## 4. Backend — Áp dụng utility functions

- [x] 4.1 Thay thế inline timestamp formatting bằng `now_formatted()` trong `vault/service.rs`
- [x] 4.2 Thay thế inline timestamp formatting bằng `now_formatted()` trong `entry/service.rs`
- [x] 4.3 Thay thế inline timestamp formatting bằng `now_formatted()` trong `field/service.rs`
- [x] 4.4 Thay thế inline vault existence check bằng `find_vault_or_error()` trong `entry/service.rs`
- [x] 4.5 Thay thế inline vault existence check bằng `find_vault_or_error()` trong `field/service.rs`
- [x] 4.6 Thay thế inline vault existence check bằng `find_vault_or_error()` trong `entry/search_service.rs`
- [x] 4.7 Thay thế inline vault existence check bằng `find_vault_or_error()` trong `relation/service.rs`

## 5. Frontend — Tạo relation module riêng

- [x] 5.1 Tạo `modules/relation/types.ts` — di chuyển `RelationEntry` type từ field/types.ts
- [x] 5.2 Tạo `modules/relation/api.ts` — di chuyển `relationApi` từ field/api.ts
- [x] 5.3 Tạo `modules/relation/index.ts` — barrel exports
- [x] 5.4 Xóa `relationApi` và `RelationEntry` khỏi `field/api.ts` và `field/types.ts`
- [x] 5.5 Cập nhật `modules/index.ts` — thêm re-export cho relation module
- [x] 5.6 Cập nhật tất cả import paths trong components sử dụng `relationApi` hoặc `RelationEntry`

## 6. Frontend — Cache appDataDir & dọn dẹp

- [x] 6.1 Tạo cached `appDataDir()` utility trong `entry/api.ts` hoặc `lib/utils.ts`
- [x] 6.2 Thay thế tất cả `appDataDir()` calls trong `entry/api.ts` bằng cached version
- [x] 6.3 Xóa thư mục trống `modules/field/hooks/`

## 7. Kiểm tra & xác minh

- [x] 7.1 Chạy `cargo check` để verify backend compile thành công
- [x] 7.2 Chạy TypeScript compiler (`tsc --noEmit`) để verify frontend không có lỗi type
- [x] 7.3 Chạy `cargo test` để verify tất cả backend tests pass
