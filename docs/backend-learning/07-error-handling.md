# 7. Error Handling

> ⏱️ **Thời gian đọc**: 15 phút

---

## 📋 Quick Reference

| Pattern      | Khi nào dùng               |
| ------------ | -------------------------- |
| `?` operator | Propagate error lên caller |
| `match`      | Handle từng case cụ thể    |
| `.map_err()` | Convert error type         |
| `.ok_or()`   | Option → Result            |

---

## 7.1 Custom Error Type

```rust
// src/core/error.rs
use thiserror::Error;
use serde::Serialize;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    #[error("Vault not found: {0}")]
    VaultNotFound(i32),

    #[error("Entry not found: {0}")]
    EntryNotFound(i32),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

// Serialize cho Tauri response
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_str(&self.to_string())
    }
}
```

---

## 7.2 Error Propagation với ?

```rust
pub async fn get_vault(db: &DatabaseConnection, id: i32) -> Result<VaultDto, AppError> {
    // ? tự động convert DbErr → AppError (nhờ #[from])
    let vault = Vault::find_by_id(id).one(db).await?;

    // Option → Result với ok_or
    vault
        .map(VaultDto::from)
        .ok_or(AppError::VaultNotFound(id))
}
```

---

## 7.3 Pattern Matching

```rust
pub async fn get_vault(db: &DatabaseConnection, id: i32) -> Result<VaultDto, AppError> {
    match Vault::find_by_id(id).one(db).await {
        Ok(Some(vault)) => Ok(VaultDto::from(vault)),
        Ok(None) => Err(AppError::VaultNotFound(id)),
        Err(e) => Err(AppError::Database(e)),
    }
}
```

---

## 7.4 Trong Commands

```rust
#[tauri::command]
pub async fn create_vault(
    db: State<'_, DatabaseConnection>,
    name: String,
) -> Result<VaultDto, AppError> {
    // Errors tự động bubble up và serialize thành JSON
    VaultService::create(&db, name).await
}
```

Frontend nhận:

```typescript
try {
    const vault = await invoke("create_vault", { name: "" });
} catch (error) {
    console.error(error); // "Validation error: Name cannot be empty"
}
```

---

## Tiếp theo

➡️ [Coding Examples](./08-examples.md)
