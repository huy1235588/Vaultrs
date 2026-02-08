## Why

Dự án Vaultrs đã phát triển qua nhiều giai đoạn với 3 module chính (vault, entry, field) cùng các module phụ (image, relation, link). Qua quá trình phát triển, codebase tích lũy nhiều vấn đề về tổ chức: code trùng lặp (timestamp generation, vault existence check), inconsistency giữa naming convention (`db` vs `conn`, `Result<T, AppError>` vs `AppResult<T>`), dead code (`AppState` struct không dùng, thư mục trống `link/`, `field/hooks/`), và dependency sai vị trí (`sea-orm-cli` là runtime dependency thay vì dev tool). Cần tối ưu ngay để giữ codebase dễ bảo trì trước khi thêm tính năng mới.

## What Changes

### Backend (Rust)
- **Loại bỏ dead code**: Xóa `AppState` struct không sử dụng trong `lib.rs`, xóa thư mục trống `link/`
- **Tạo utility module**: Tập trung các hàm dùng chung (timestamp formatting, vault existence verification) vào `core/utils.rs`
- **Thống nhất naming**: Đổi tất cả command parameter từ `conn` → `db` cho nhất quán
- **Thống nhất return type**: Sử dụng `AppResult<T>` thống nhất thay vì mix `Result<T, AppError>`
- **Fix dependency**: Chuyển `sea-orm-cli` từ `[dependencies]` sang `[dev-dependencies]` hoặc loại bỏ khỏi Cargo.toml (dùng qua cargo install)
- **Giảm duplication**: Extract `ImageStorage` instantiation thành helper, centralize test setup

### Frontend (React/TypeScript)
- **Tách `relationApi`**: Di chuyển `relationApi` từ `field/api.ts` sang module riêng `relation/` cho khớp với backend module
- **Xóa thư mục trống**: Xóa `field/hooks/` (empty directory)
- **Cache `appDataDir()`**: Lưu kết quả `appDataDir()` thay vì gọi lại mỗi lần trong entry API
- **Thống nhất import style**: Ưu tiên absolute imports (`@/modules/...`) trong component files

### Chung
- **Loại bỏ file/folder thừa**: Dọn dẹp thư mục trống và code không sử dụng

## Capabilities

### New Capabilities
- `backend-utilities`: Module `core/utils.rs` tập trung các hàm utility dùng chung (timestamp, validation helpers)
- `frontend-relation-module`: Module `relation/` riêng biệt ở frontend, tách khỏi field module

### Modified Capabilities
_(Không có thay đổi spec-level behavior — chỉ refactor cấu trúc nội bộ)_

## Impact

- **Backend code**: `core/`, `commands/`, `vault/`, `entry/`, `field/`, `relation/`, `image/` — refactor imports và sử dụng utility functions
- **Frontend code**: `modules/field/`, `modules/entry/` — tách relation API, update imports
- **Build**: `Cargo.toml` — chuyển `sea-orm-cli` dependency
- **Không breaking changes**: Tất cả public API (Tauri commands) giữ nguyên, không ảnh hưởng end-user
- **Risk thấp**: Đây là refactoring nội bộ, không thay đổi logic business hay database schema
