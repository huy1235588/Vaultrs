# 6. Database & ORM

> ⏱️ **Thời gian đọc**: 20 phút

---

## 📋 Quick Reference

| Operation | SeaORM | SQL |
|-----------|--------|-----|
| Find by ID | `Entity::find_by_id(1).one(&db)` | `SELECT * WHERE id = 1` |
| Find all | `Entity::find().all(&db)` | `SELECT *` |
| Insert | `model.insert(&db)` | `INSERT INTO ...` |
| Update | `model.update(&db)` | `UPDATE SET ...` |
| Delete | `model.delete(&db)` | `DELETE FROM ...` |

---

## 6.1 SQLite Overview

- **Embedded database** - không cần server
- **Single file** - tất cả trong `.db`
- **Zero config** - không setup

```
Location: %APPDATA%/com.vaultrs.app/vaultrs.db
```

---

## 6.2 Entity Definition

```rust
use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, DeriveEntityModel)]
#[sea_orm(table_name = "vaults")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime,
}
```

---

## 6.3 CRUD Operations

### Create
```rust
let vault = vault::ActiveModel {
    name: Set("My Vault".to_string()),
    ..Default::default()
};
vault.insert(&db).await?;
```

### Read
```rust
// By ID
Vault::find_by_id(1).one(&db).await?;

// All
Vault::find().all(&db).await?;

// Filter
Vault::find()
    .filter(Column::Name.contains("test"))
    .all(&db).await?;
```

### Update
```rust
let mut vault: vault::ActiveModel = vault.into();
vault.name = Set("New Name".to_string());
vault.update(&db).await?;
```

### Delete
```rust
vault.delete(&db).await?;
```

---

## Tiếp theo

➡️ [Error Handling](./07-error-handling.md)
