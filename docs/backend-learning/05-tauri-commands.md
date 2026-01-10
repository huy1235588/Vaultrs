# 5. Tauri Commands

> ⏱️ **Thời gian đọc**: 15 phút

---

## 📋 Quick Reference

| Concept | Syntax |
|---------|--------|
| Define command | `#[tauri::command]` |
| Inject state | `State<'_, T>` |
| Return success | `Result<T, AppError>` |
| Register | `tauri::generate_handler![cmd1, cmd2]` |

---

## 5.1 Frontend ↔ Backend Communication

### Frontend gọi Backend

```typescript
// src/services/vault.ts (TypeScript)
import { invoke } from '@tauri-apps/api/core';

interface VaultDto {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
}

// Gọi Rust command
export async function createVault(name: string, description?: string): Promise<VaultDto> {
  return invoke<VaultDto>('create_vault', {
    name,
    description,
  });
}
```

### Backend nhận và xử lý

```rust
// src/commands/vault_commands.rs (Rust)
#[tauri::command]  // ← Macro này expose function cho frontend
pub async fn create_vault(
    db: State<'_, DatabaseConnection>,
    name: String,
    description: Option<String>,
) -> Result<VaultDto, AppError> {
    // name và description được deserialize từ JSON tự động
    VaultService::create(&db, CreateVaultDto { name, description, ..Default::default() }).await
}
```

---

## 5.2 Macro `#[tauri::command]`

### Macro làm gì?

1. **Expose** function qua IPC (Inter-Process Communication)
2. **Deserialize** input từ JSON → Rust types
3. **Serialize** output từ Rust types → JSON
4. **Handle** async/await tự động

### Rules

| Input Type | Must Implement |
|------------|----------------|
| Parameters | `Deserialize` |
| Return Ok | `Serialize` |
| Return Err | `Serialize` |

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize)]  // ← Bắt buộc cho return type
pub struct VaultDto {
    pub id: i32,
    pub name: String,
}

#[derive(Deserialize)]  // ← Nếu dùng struct làm input
pub struct CreateVaultInput {
    pub name: String,
    pub description: Option<String>,
}
```

---

## 5.3 State Management

### Setup State

```rust
// src/lib.rs
use tauri::Manager;
use sea_orm::DatabaseConnection;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Tạo database connection
            let db: DatabaseConnection = /* ... */;
            
            // Đăng ký state - có thể inject vào bất kỳ command nào
            app.manage(db);
            
            Ok(())
        })
        // ...
}
```

### Inject State vào Command

```rust
use tauri::State;

#[tauri::command]
pub async fn list_vaults(
    db: State<'_, DatabaseConnection>,  // ← Inject database
) -> Result<Vec<VaultDto>, AppError> {
    // db được tự động inject bởi Tauri
    VaultService::list(&db).await
}
```

### Multiple States

```rust
pub struct AppConfig {
    pub max_vaults: usize,
    pub theme: String,
}

// Setup
app.manage(db);
app.manage(AppConfig { max_vaults: 100, theme: "dark".into() });

// Command
#[tauri::command]
pub async fn create_vault(
    db: State<'_, DatabaseConnection>,
    config: State<'_, AppConfig>,  // ← Multiple states
    name: String,
) -> Result<VaultDto, AppError> {
    // ...
}
```

---

## 5.4 Registering Commands

```rust
// src/lib.rs
use crate::commands::{
    vault_commands::*,
    entry_commands::*,
};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Setup...
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Vault commands
            create_vault,
            get_vault,
            list_vaults,
            update_vault,
            delete_vault,
            
            // Entry commands
            create_entry,
            list_entries,
            update_entry,
            delete_entry,
            
            // Thêm command mới ở đây!
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

> [!WARNING]
> Nếu quên register command, frontend sẽ nhận lỗi "command not found".

---

## 5.5 Parameter Types

### Primitive Types

```rust
#[tauri::command]
pub async fn example(
    id: i32,                    // Required number
    name: String,               // Required string
    active: bool,               // Required boolean
    count: Option<i32>,         // Optional number
    tags: Vec<String>,          // Array of strings
) -> Result<(), AppError> {
    Ok(())
}
```

```typescript
// TypeScript call
invoke('example', {
  id: 1,
  name: 'test',
  active: true,
  count: 5,        // hoặc không truyền
  tags: ['a', 'b']
});
```

### Complex Types

```rust
#[derive(Deserialize)]
pub struct CreateVaultInput {
    pub name: String,
    pub description: Option<String>,
    pub settings: VaultSettings,
}

#[derive(Deserialize)]
pub struct VaultSettings {
    pub is_public: bool,
    pub max_entries: i32,
}

#[tauri::command]
pub async fn create_vault_complex(
    db: State<'_, DatabaseConnection>,
    input: CreateVaultInput,  // ← Struct parameter
) -> Result<VaultDto, AppError> {
    // ...
}
```

```typescript
invoke('create_vault_complex', {
  input: {
    name: 'My Vault',
    description: 'Description',
    settings: {
      is_public: false,
      max_entries: 1000
    }
  }
});
```

---

## 5.6 Async Commands

```rust
// Async command - cho database/network operations
#[tauri::command]
pub async fn async_operation(
    db: State<'_, DatabaseConnection>,
) -> Result<Vec<VaultDto>, AppError> {
    // .await cho async operations
    VaultService::list(&db).await
}

// Sync command - cho operations không cần async
#[tauri::command]
pub fn sync_operation(name: String) -> String {
    format!("Hello, {}!", name)
}
```

---

## 📝 Checklist Tạo Command Mới

- [ ] Tạo function với `#[tauri::command]`
- [ ] Inject states cần thiết (`State<'_, T>`)
- [ ] Define input parameters
- [ ] Return `Result<T, AppError>`
- [ ] Register trong `generate_handler![]`
- [ ] Test từ frontend với `invoke()`

---

## Tiếp theo

➡️ [Database & ORM](./06-database-orm.md) - SeaORM và CRUD operations
