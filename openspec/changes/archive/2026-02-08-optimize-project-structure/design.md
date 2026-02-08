## Context

Dự án Vaultrs là một Desktop Application (Tauri v2) với kiến trúc modular: Backend Rust (commands → services → entities) và Frontend React/TypeScript (modules pattern: api/store/types/components). Hiện tại codebase có 3 module chính (vault, entry, field) và các module phụ (image, relation, link).

Qua phân tích codebase hiện tại, phát hiện các vấn đề:

1. **Dead code & files**: `AppState` struct trong `lib.rs` không được sử dụng, thư mục trống `link/` và `field/hooks/`
2. **Code duplication**: Timestamp formatting lặp lại ở mọi service, vault existence check lặp lại ở 4+ files, `ImageStorage` instantiation lặp ở mọi image command, `appDataDir()` gọi 5 lần trong entry API
3. **Naming inconsistency**: Command parameter `db` vs `conn`, return type `Result<T, AppError>` vs `AppResult<T>`
4. **Module boundary violation**: `relationApi` nằm trong `field/api.ts` thay vì module riêng
5. **Dependency sai vị trí**: `sea-orm-cli` là runtime dependency trong Cargo.toml

## Goals / Non-Goals

**Goals:**
- Loại bỏ toàn bộ dead code và thư mục trống
- Tập trung các hàm utility dùng chung vào `core/utils.rs`
- Thống nhất naming convention và return type trong toàn bộ backend
- Tách `relationApi` thành module riêng ở frontend
- Fix `sea-orm-cli` dependency
- Cache `appDataDir()` ở frontend

**Non-Goals:**
- Không thay đổi business logic hay database schema
- Không thay đổi public Tauri command API (tên, parameters, return types)
- Không refactor component UI hay styling
- Không thêm tính năng mới
- Không thay đổi architecture pattern (commands → services → entities)
- Không refactor test logic (chỉ centralize test setup utilities)

## Decisions

### 1. Tạo `core/utils.rs` cho hàm utility dùng chung

**Quyết định**: Tạo file `core/utils.rs` chứa:
- `now_formatted() -> String` — timestamp formatting
- `find_vault_or_error(conn, vault_id) -> AppResult<vault::Model>` — vault existence check

**Lý do**: Hai pattern này lặp lại ở 4+ files. Tập trung giúp duy trì consistency và dễ thay đổi format nếu cần.

**Alternatives considered**:
- Trait extension trên `DatabaseConnection` → Quá phức tạp cho 2 hàm đơn giản
- Macro → Overhead không cần thiết, hàm bình thường đủ rõ ràng

### 2. Thống nhất parameter naming: `db` everywhere

**Quyết định**: Sử dụng `db: State<'_, DatabaseConnection>` cho tất cả commands. Đổi `conn` trong `field_commands.rs` thành `db`.

**Lý do**: 4/5 command files đã dùng `db`, chỉ 1 file dùng `conn`. Đổi file ít nhất để minimize changes.

### 3. Thống nhất return type: `AppResult<T>` everywhere

**Quyết định**: Sử dụng `AppResult<T>` (đã defined trong `core/error.rs`) thay vì `Result<T, AppError>` ở tất cả commands.

**Lý do**: `AppResult<T>` ngắn gọn hơn, đã có sẵn type alias, giảm boilerplate.

### 4. Xóa `AppState` struct, giữ raw `DatabaseConnection` management

**Quyết định**: Xóa `AppState` struct trong `lib.rs` vì không được sử dụng. Giữ cách manage `DatabaseConnection` trực tiếp qua `app.manage(conn)`.

**Lý do**: Hiện tại chỉ cần manage 1 state (database connection). `AppState` struct thêm abstraction layer không cần thiết. Nếu sau này cần thêm state (config, cache), có thể tạo lại với thiết kế phù hợp hơn.

### 5. Tách relation module ở frontend

**Quyết định**: Tạo `modules/relation/` mới với cấu trúc:
```
modules/relation/
├── api.ts        # relationApi (di chuyển từ field/api.ts)
├── types.ts      # RelationEntry type (di chuyển từ field/types.ts)
├── index.ts      # Barrel exports
```

**Lý do**: Backend đã có module `relation/` riêng biệt. Frontend nên mirror cấu trúc backend để dễ navigate và maintain. Relation logic không thuộc về field domain.

### 6. Cache `appDataDir()` ở frontend

**Quyết định**: Tạo một cached promise cho `appDataDir()` trong entry API hoặc một shared utility, gọi 1 lần và reuse.

**Lý do**: `appDataDir()` trả về cùng giá trị mỗi lần (path không đổi trong runtime). Gọi 5 lần là lãng phí. Dùng module-level cached variable.

### 7. `sea-orm-cli` dependency

**Quyết định**: Loại bỏ `sea-orm-cli` khỏi `[dependencies]` trong Cargo.toml. CLI tool này được sử dụng qua `cargo install sea-orm-cli` và không cần compile vào binary.

**Lý do**: `sea-orm-cli` là development tool, không phải runtime dependency. Giữ trong dependencies làm tăng compile time và binary size.

## Risks / Trade-offs

- **[Risk] Sai khi di chuyển relationApi** → Mitigation: Kiểm tra tất cả import paths, update barrel exports, chạy TypeScript compiler để verify
- **[Risk] Thay đổi parameter names gây lỗi runtime** → Mitigation: Tauri IPC sử dụng `#[tauri::command]` macro, parameter names trong function signature không ảnh hưởng serialization. Chỉ là internal naming
- **[Risk] Xóa nhầm code đang dùng** → Mitigation: Chỉ xóa items đã verified là unused qua grep search. Giữ nguyên `reqwest` dependency vì có thể đang sử dụng
- **[Risk] Break existing imports** → Mitigation: Update tất cả import paths và barrel exports cùng lúc, dùng TypeScript strict mode để catch lỗi compile-time
