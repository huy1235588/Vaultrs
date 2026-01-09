# 🦀 Backend Rust Overview - Vaultrs

> **Mục tiêu:** Giới thiệu tổng quan về backend Rust sử dụng Tauri framework.

---

## 📋 TL;DR

| Component       | Technology     | Purpose                        |
| --------------- | -------------- | ------------------------------ |
| **Framework**   | Tauri v2       | Desktop app framework          |
| **Runtime**     | Tokio          | Async runtime                  |
| **ORM**         | SeaORM         | Database abstraction           |
| **HTTP Client** | Reqwest        | External API calls             |
| **Serialization** | Serde        | JSON serialization             |

---

## 1. 📖 Project Structure

### Current Structure

```
desktop/src-tauri/
├── Cargo.toml              # Dependencies
├── Cargo.lock              # Lock file
├── tauri.conf.json         # Tauri configuration
├── build.rs                # Build script
├── capabilities/           # Tauri v2 permissions
├── icons/                  # App icons
└── src/
    ├── main.rs             # Entry point
    └── lib.rs              # Library root
```

### Planned Structure (Module-based)

```
desktop/src-tauri/src/
├── main.rs                 # Entry point
├── lib.rs                  # Module registration
│
├── core/                   # 🔧 Core Utilities
│   ├── mod.rs
│   ├── error.rs            # Custom error types
│   ├── result.rs           # Result aliases
│   └── config.rs           # App configuration
│
├── db/                     # 💾 Database
│   ├── mod.rs
│   ├── connection.rs       # DB connection
│   └── migrations/         # SeaORM migrations
│
├── models/                 # 📊 Data Models
│   ├── mod.rs
│   ├── collection.rs       # Collection entity
│   ├── attribute.rs        # Attribute entity
│   └── item.rs             # Item entity
│
├── repositories/           # 📦 Data Access
│   ├── mod.rs
│   ├── collection_repo.rs
│   └── item_repo.rs
│
├── services/               # ⚙️ Business Logic
│   ├── mod.rs
│   ├── collection_service.rs
│   ├── item_service.rs
│   └── crawler_service.rs
│
└── commands/               # 🎮 Tauri Commands
    ├── mod.rs
    ├── collection_commands.rs
    ├── item_commands.rs
    └── crawler_commands.rs
```

---

## 2. 📦 Dependencies

### Core Dependencies

```toml
[dependencies]
# Tauri framework
tauri = { version = "2.0.0", features = [] }
tauri-plugin-opener = "2.0.0"

# Async runtime
tokio = { version = "1", features = ["full"] }

# Database
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite"] }
sea-orm = { version = "1", features = ["sqlx-sqlite", "runtime-tokio-rustls"] }

# HTTP client
reqwest = { version = "0.12", features = ["json"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Error handling
thiserror = "1.0"

# Logging
log = "0.4"
env_logger = "0.11"
```

### Dependency Purposes

| Crate        | Purpose                    |
| ------------ | -------------------------- |
| `tauri`      | Desktop app framework      |
| `tokio`      | Async runtime              |
| `sea-orm`    | ORM for database access    |
| `reqwest`    | HTTP client for crawlers   |
| `serde`      | Serialization/deserialization |
| `thiserror`  | Error type derivation      |

---

## 3. 🏗️ Architecture Layers

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     TAURI COMMANDS                          │
│  Entry points from frontend (invoke handlers)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       SERVICES                               │
│  Business logic, validation, orchestration                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     REPOSITORIES                             │
│  Database CRUD operations, query building                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       MODELS                                 │
│  SeaORM entities, DTOs                                      │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer        | Responsibility                          |
| ------------ | --------------------------------------- |
| Commands     | Parse input, call service, format output |
| Services     | Business logic, validation              |
| Repositories | Database access abstraction             |
| Models       | Data structures, entity definitions     |

---

## 4. ⚡ Entry Point

### main.rs

```rust
// desktop/src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    vaultrs_lib::run();
}
```

### lib.rs

```rust
// desktop/src-tauri/src/lib.rs
use tauri::Manager;

mod commands;
mod core;
mod db;
mod models;
mod repositories;
mod services;

pub struct AppState {
    pub db: sea_orm::DatabaseConnection,
    // services will be added here
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize database on startup
            let handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let db = db::init_database().await.expect("Failed to init DB");
                handle.manage(AppState { db });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Register commands here
            commands::get_collections,
            commands::create_collection,
            commands::get_items,
            commands::create_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 5. 🔐 Tauri v2 Capabilities

### capabilities/default.json

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for Vaultrs",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "fs:default",
    "dialog:default"
  ]
}
```

### Permission System

Tauri v2 uses a capability-based security model:

| Permission      | Purpose                    |
| --------------- | -------------------------- |
| `core:default`  | Basic Tauri functionality  |
| `fs:default`    | File system access         |
| `dialog:default`| System dialogs             |

---

## 6. 🛠️ Development Commands

### Build & Run

```bash
cd desktop

# Development (frontend + backend)
pnpm run dev

# Or run Tauri directly
cargo tauri dev

# Build production
cargo tauri build
```

### Rust-only Commands

```bash
cd desktop/src-tauri

# Check code
cargo check

# Build
cargo build

# Run tests
cargo test

# Format
cargo fmt

# Lint
cargo clippy
```

---

## 7. 📋 Module Checklist

### Implementation Status

| Module       | Status      | Files                    |
| ------------ | ----------- | ------------------------ |
| core/        | ⬜ Planned  | error.rs, config.rs      |
| db/          | ⬜ Planned  | connection.rs, migrations|
| models/      | ⬜ Planned  | collection.rs, item.rs   |
| repositories/| ⬜ Planned  | collection_repo.rs       |
| services/    | ⬜ Planned  | collection_service.rs    |
| commands/    | ⬜ Planned  | collection_commands.rs   |

---

## 🔗 Tài liệu Liên quan

- [Tauri Commands](./2-commands.md)
- [Error Handling](./3-error-handling.md)
- [Services](./4-services.md)
- [Database Integration](../02-database/)

---

_Cập nhật: 2026-01-08_
