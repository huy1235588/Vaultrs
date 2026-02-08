## ADDED Requirements

### Requirement: Core utility module cung cấp hàm timestamp formatting
Hệ thống SHALL cung cấp hàm `now_formatted()` trong `core/utils.rs` trả về timestamp dạng `String` với format `%Y-%m-%d %H:%M:%S` (UTC). Tất cả services MUST sử dụng hàm này thay vì gọi trực tiếp `chrono::Utc::now().format(...)`.

#### Scenario: Service tạo mới record sử dụng utility timestamp
- **WHEN** bất kỳ service nào cần tạo timestamp cho `created_at` hoặc `updated_at`
- **THEN** service MUST gọi `crate::core::now_formatted()` thay vì inline formatting

#### Scenario: Format timestamp nhất quán
- **WHEN** `now_formatted()` được gọi
- **THEN** kết quả MUST có format `YYYY-MM-DD HH:MM:SS` (UTC timezone)

### Requirement: Core utility module cung cấp hàm vault existence verification
Hệ thống SHALL cung cấp hàm `find_vault_or_error(conn: &DatabaseConnection, vault_id: i32) -> AppResult<vault::Model>` trong `core/utils.rs`. Hàm này MUST tìm vault theo ID và trả về `AppError::VaultNotFound(vault_id)` nếu không tồn tại.

#### Scenario: Vault tồn tại
- **WHEN** `find_vault_or_error` được gọi với `vault_id` hợp lệ
- **THEN** hàm trả về `Ok(vault::Model)` tương ứng

#### Scenario: Vault không tồn tại
- **WHEN** `find_vault_or_error` được gọi với `vault_id` không tồn tại trong database
- **THEN** hàm trả về `Err(AppError::VaultNotFound(vault_id))`

#### Scenario: Tất cả services sử dụng hàm chung
- **WHEN** bất kỳ service nào cần verify vault existence (entry, field, relation, search)
- **THEN** service MUST gọi `crate::core::find_vault_or_error()` thay vì inline query

### Requirement: Thống nhất naming convention cho command parameters
Tất cả Tauri command handlers MUST sử dụng tên parameter `db` cho `State<'_, DatabaseConnection>`. KHÔNG được sử dụng `conn` hay tên khác.

#### Scenario: Field commands sử dụng đúng naming
- **WHEN** xem `field_commands.rs`
- **THEN** parameter cho database connection MUST có tên `db`, không phải `conn`

### Requirement: Thống nhất return type cho commands
Tất cả Tauri command handlers MUST sử dụng `AppResult<T>` type alias thay vì `Result<T, AppError>`.

#### Scenario: Commands trả về kiểu nhất quán
- **WHEN** xem bất kỳ command handler nào
- **THEN** return type MUST là `AppResult<T>` (không phải `Result<T, AppError>`)

### Requirement: Loại bỏ dead code và files thừa
Hệ thống MUST không chứa dead code đã identified: `AppState` struct không sử dụng, thư mục trống (`link/`, `field/hooks/`).

#### Scenario: AppState struct được xóa
- **WHEN** xem `lib.rs`
- **THEN** MUST không còn `AppState` struct definition

#### Scenario: Thư mục trống được xóa
- **WHEN** kiểm tra project structure
- **THEN** MUST không còn thư mục `src-tauri/src/link/` và `desktop/src/modules/field/hooks/`

### Requirement: sea-orm-cli không phải runtime dependency
`sea-orm-cli` MUST không nằm trong `[dependencies]` của Cargo.toml. CLI tool này được cài qua `cargo install` và không cần compile vào binary.

#### Scenario: Cargo.toml không chứa sea-orm-cli
- **WHEN** xem `[dependencies]` section trong Cargo.toml
- **THEN** MUST không có entry cho `sea-orm-cli`
