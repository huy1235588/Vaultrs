# ⚠️ Error Handling - Vaultrs

> **Mục tiêu:** Hướng dẫn xử lý errors trong backend Rust với custom error types.

---

## 📋 TL;DR

| Crate       | Purpose                           |
| ----------- | --------------------------------- |
| `thiserror` | Derive custom error types         |
| `anyhow`    | Easy error propagation (optional) |
| `Result<T>` | Custom result alias               |

---

## 1. 📖 Custom Error Types

### VaultError Definition

```rust
// src/core/error.rs
use thiserror::Error;
use serde::Serialize;

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

// Serialize for Tauri IPC
impl Serialize for VaultError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
```

### Result Type Alias

```rust
// src/core/result.rs
use crate::core::error::VaultError;

pub type Result<T> = std::result::Result<T, VaultError>;
```

---

## 2. 🔄 Error Propagation

### Using ? Operator

```rust
use crate::core::{Result, VaultError};

pub async fn get_item(db: &DatabaseConnection, id: i32) -> Result<Item> {
    // DbErr automatically converts to VaultError::Database
    let item = Item::find_by_id(id)
        .one(db)
        .await?;  // ? propagates error

    // Convert None to custom error
    item.ok_or(VaultError::NotFound(format!("Item {}", id)))
}
```

### Manual Conversion

```rust
pub async fn parse_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| VaultError::Io(e))?;

    let config: Config = serde_json::from_str(&content)
        .map_err(|e| VaultError::Json(e))?;

    Ok(config)
}
```

---

## 3. 📦 Error in Commands

### Command with Result

```rust
#[tauri::command]
pub async fn get_item(
    state: State<'_, AppState>,
    id: i32,
) -> Result<Item, VaultError> {
    let item = ItemService::get_by_id(&state.db, id).await?;

    item.ok_or(VaultError::NotFound(format!("Item {} not found", id)))
}
```

### Command with String Error (Simple)

```rust
#[tauri::command]
pub async fn get_item(
    state: State<'_, AppState>,
    id: i32,
) -> Result<Item, String> {
    ItemService::get_by_id(&state.db, id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Item {} not found", id))
}
```

---

## 4. ✅ Validation Errors

### Validation Logic

```rust
// src/services/item_service.rs
use crate::core::{Result, VaultError};

impl ItemService {
    pub async fn create(
        db: &DatabaseConnection,
        collection_id: i32,
        title: String,
        properties: Option<JsonValue>,
    ) -> Result<Item> {
        // Validation
        Self::validate_title(&title)?;
        Self::validate_collection_exists(db, collection_id).await?;

        // Create item...
        Ok(item)
    }

    fn validate_title(title: &str) -> Result<()> {
        if title.is_empty() {
            return Err(VaultError::Validation(
                "Title cannot be empty".to_string()
            ));
        }

        if title.len() > 255 {
            return Err(VaultError::Validation(
                "Title cannot exceed 255 characters".to_string()
            ));
        }

        Ok(())
    }

    async fn validate_collection_exists(
        db: &DatabaseConnection,
        collection_id: i32,
    ) -> Result<()> {
        let exists = Collection::find_by_id(collection_id)
            .one(db)
            .await?
            .is_some();

        if !exists {
            return Err(VaultError::NotFound(
                format!("Collection {} not found", collection_id)
            ));
        }

        Ok(())
    }
}
```

---

## 5. 🌐 Frontend Error Handling

### TypeScript Error Types

```typescript
// src/types/error.types.ts
export interface ApiError {
    type: "database" | "not_found" | "validation" | "internal";
    message: string;
}

export function parseError(error: unknown): ApiError {
    const message = typeof error === "string" ? error : "Unknown error";

    if (message.includes("Not found")) {
        return { type: "not_found", message };
    }
    if (message.includes("Validation")) {
        return { type: "validation", message };
    }
    if (message.includes("Database")) {
        return { type: "database", message };
    }

    return { type: "internal", message };
}
```

### Error Handling in React

```typescript
import { toast } from "sonner";
import { parseError } from "@/types/error.types";

async function createItem(title: string) {
    try {
        const item = await api.createItem(collectionId, title);
        toast.success("Item created successfully");
        return item;
    } catch (error) {
        const { type, message } = parseError(error);

        switch (type) {
            case "validation":
                toast.error(message);
                break;
            case "not_found":
                toast.error("Collection not found");
                break;
            default:
                toast.error("An unexpected error occurred");
                console.error(error);
        }

        return null;
    }
}
```

---

## 6. 📝 Logging Errors

### Setup Logging

```rust
// src/lib.rs
pub fn run() {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("info")
    )
    .init();

    // ...
}
```

### Log Errors in Services

```rust
use log::{error, warn, info};

impl ItemService {
    pub async fn create(...) -> Result<Item> {
        info!("Creating item: {}", title);

        match Self::do_create(db, title, properties).await {
            Ok(item) => {
                info!("Created item with id: {}", item.id);
                Ok(item)
            }
            Err(e) => {
                error!("Failed to create item: {}", e);
                Err(e)
            }
        }
    }
}
```

---

## 7. ✅ Best Practices

### Do's

-   ✅ Use specific error variants for different cases
-   ✅ Include context in error messages
-   ✅ Log errors at appropriate levels
-   ✅ Convert errors at boundaries (command layer)
-   ✅ Use `?` operator for propagation

### Don'ts

-   ❌ Use `.unwrap()` or `.expect()` in production code
-   ❌ Ignore errors silently
-   ❌ Return raw error messages to frontend (security)
-   ❌ Use panic!() for recoverable errors

### Example: Complete Error Flow

```rust
// Service layer - returns VaultError
pub async fn update_item(...) -> Result<Item> {
    // Validation
    Self::validate_item(&update)?;

    // Get existing item
    let existing = Item::find_by_id(id)
        .one(db)
        .await?
        .ok_or(VaultError::NotFound("Item not found".into()))?;

    // Update
    let updated = existing.update(db, update).await?;

    Ok(updated)
}

// Command layer - converts to String for IPC
#[tauri::command]
pub async fn update_item(...) -> Result<Item, String> {
    ItemService::update_item(&state.db, id, update)
        .await
        .map_err(|e| {
            log::error!("Update failed: {}", e);
            e.to_string()
        })
}
```

---

## 🔗 Tài liệu Liên quan

-   [Backend Overview](./1-overview.md)
-   [Commands](./2-commands.md)
-   [Services](./4-services.md)

---

_Cập nhật: 2026-01-08_
