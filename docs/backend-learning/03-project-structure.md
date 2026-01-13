# 3. Cấu trúc Dự án

> ⏱️ **Thời gian đọc**: 15 phút

---

## 📋 Quick Reference

| Folder             | Vai trò                           |
| ------------------ | --------------------------------- |
| `commands/`        | Tauri IPC handlers (Layer 1)      |
| `core/`            | Utilities, error types            |
| `db/`              | Database connection & migrations  |
| `entities/`        | SeaORM models                     |
| `vault/`, `entry/` | Business logic services (Layer 2) |

---

## 3.1 Folder Structure

```
desktop/src-tauri/src/
├── main.rs                  # Entry point (chỉ gọi lib::run)
├── lib.rs                   # Library root - setup app
│
├── commands/                # 🎮 Layer 1: IPC Handlers
│   ├── mod.rs               # Export all commands
│   ├── vault_commands.rs    # Vault CRUD commands
│   └── entry_commands.rs    # Entry CRUD commands
│
├── core/                    # 🔧 Shared Utilities
│   ├── mod.rs
│   └── error.rs             # Custom error types
│
├── db/                      # 💾 Database Layer
│   ├── mod.rs
│   ├── connection.rs        # DB connection setup
│   └── migrations.rs        # Schema migrations
│
├── entities/                # 📊 Layer 3: SeaORM Entities
│   ├── mod.rs
│   ├── vault.rs             # Vault table model
│   └── entry.rs             # Entry table model
│
├── vault/                   # 🏢 Layer 2: Vault Service
│   ├── mod.rs
│   ├── service.rs           # Business logic
│   └── dto.rs               # Data transfer objects
│
└── entry/                   # 📝 Layer 2: Entry Service
    ├── mod.rs
    ├── service.rs
    └── dto.rs
```

---

## 3.2 Module System

### Rust Module Basics

Rust tổ chức code thành **modules**. Mỗi file hoặc folder là một module.

```rust
// File: src/vault/mod.rs
// Đây là file "root" của module vault

pub mod service;  // Khai báo submodule "service" (file: service.rs)
pub mod dto;      // Khai báo submodule "dto" (file: dto.rs)

// Re-export để dùng tiện hơn
pub use service::VaultService;
pub use dto::{VaultDto, CreateVaultDto};
```

```rust
// File: src/lib.rs
// Root của toàn bộ library

mod commands;   // Include module commands/
mod core;       // Include module core/
mod db;         // Include module db/
mod entities;   // Include module entities/
mod vault;      // Include module vault/
mod entry;      // Include module entry/

// Người dùng có thể import:
use crate::vault::VaultService;
use crate::vault::{VaultDto, CreateVaultDto};
```

### Visibility

| Keyword      | Scope                      |
| ------------ | -------------------------- |
| (nothing)    | Private - chỉ trong module |
| `pub`        | Public - ai cũng dùng được |
| `pub(crate)` | Public trong crate này     |
| `pub(super)` | Public cho parent module   |

---

## 3.3 File Quan Trọng

### `main.rs` - Entry Point

```rust
// Chỉ có 1 dòng, gọi lib::run()
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    vaultrs_lib::run();
}
```

### `lib.rs` - App Setup

```rust
mod commands;
mod core;
mod db;
mod entities;
mod vault;
mod entry;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 1. Initialize database
            let db = db::init()?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 2. Register all commands
            commands::create_vault,
            commands::list_vaults,
            // ... more commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 3.4 Data Flow

```
Frontend (React)
    │
    │ invoke("create_vault", { name: "My Vault" })
    ▼
commands/vault_commands.rs
    │ #[tauri::command] create_vault(...)
    │
    ▼
vault/service.rs
    │ VaultService::create(db, dto)
    │ - Validate input
    │ - Apply business logic
    │
    ▼
entities/vault.rs
    │ Vault::insert(db)
    │ - Execute SQL INSERT
    │
    ▼
SQLite Database
```

---

## 3.5 Cargo.toml

```toml
[package]
name = "vaultrs"
version = "0.1.0"
edition = "2021"

[dependencies]
# Tauri framework
tauri = { version = "2", features = ["devtools"] }

# Async runtime
tokio = { version = "1", features = ["full"] }

# Database ORM
sea-orm = { version = "1", features = ["sqlx-sqlite", "runtime-tokio-native-tls"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Error handling
thiserror = "1"

# Date/Time
chrono = { version = "0.4", features = ["serde"] }
```

---

## 📝 Kiểm tra Hiểu biết

-   [ ] Biết file nào là entry point
-   [ ] Hiểu được data flow từ Frontend → Backend → Database
-   [ ] Có thể tìm được code của một command cụ thể
-   [ ] Hiểu cách Rust module system hoạt động

---

## Tiếp theo

➡️ [Kiến trúc 3 Layers](./04-architecture.md) - Deep dive vào từng layer
