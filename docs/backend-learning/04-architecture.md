# 4. Kiến trúc 3 Layers

> ⏱️ **Thời gian đọc**: 20 phút

---

## 📋 Quick Reference

| Layer | File | Trách nhiệm |
|-------|------|-------------|
| **1. Commands** | `commands/*.rs` | Nhận request, gọi service |
| **2. Services** | `*/service.rs` | Business logic, validation |
| **3. Database** | `entities/*.rs` | CRUD operations |

---

## Tổng quan

```
┌─────────────────────────────────────────┐
│    Layer 1: Commands (IPC Handlers)     │
│    • vault_commands.rs                  │
│    • entry_commands.rs                  │
│    • Nhận requests từ frontend          │
└──────────────┬──────────────────────────┘
               │ Gọi service methods
┌──────────────▼──────────────────────────┐
│    Layer 2: Services (Business Logic)   │
│    • vault/service.rs                   │
│    • entry/service.rs                   │
│    • Validation, calculations           │
└──────────────┬──────────────────────────┘
               │ Database queries
┌──────────────▼──────────────────────────┐
│    Layer 3: Database (Data Access)      │
│    • SeaORM entities                    │
│    • CRUD operations                    │
└─────────────────────────────────────────┘
```

---

## Layer 1: Commands

> 📍 **Location**: `src/commands/vault_commands.rs`

### Vai trò
- **Nhận** input từ frontend qua IPC
- **Validate** input cơ bản (type checking tự động)
- **Gọi** service layer
- **Trả về** response cho frontend

### Ví dụ

```rust
use tauri::State;
use sea_orm::DatabaseConnection;
use crate::vault::{VaultService, VaultDto, CreateVaultDto};
use crate::core::error::AppError;

#[tauri::command]
pub async fn create_vault(
    db: State<'_, DatabaseConnection>,  // Injected database connection
    name: String,
    description: Option<String>,
    icon: Option<String>,
    color: Option<String>,
) -> Result<VaultDto, AppError> {
    // 1. Tạo DTO từ input
    let dto = CreateVaultDto {
        name,
        description,
        icon,
        color,
    };

    // 2. Delegate cho service (KHÔNG có business logic ở đây)
    VaultService::create(&db, dto).await
}
```

### ❌ KHÔNG nên làm ở Layer 1

```rust
#[tauri::command]
pub async fn create_vault(...) -> Result<VaultDto, AppError> {
    // ❌ KHÔNG validate phức tạp ở đây
    if name.len() < 3 || name.len() > 100 {
        return Err(AppError::Validation("Invalid name".into()));
    }

    // ❌ KHÔNG query database trực tiếp
    let existing = Vault::find()
        .filter(vault::Column::Name.eq(&name))
        .one(&db)
        .await?;

    // ❌ KHÔNG có business logic
    if existing.is_some() {
        return Err(AppError::Conflict("Vault exists".into()));
    }
    
    // Đây nên ở Service layer!
}
```

---

## Layer 2: Services

> 📍 **Location**: `src/vault/service.rs`

### Vai trò
- **Validate** dữ liệu (business rules)
- **Xử lý** business logic
- **Gọi** database operations
- **Convert** models ↔ DTOs

### Ví dụ

```rust
use sea_orm::{DatabaseConnection, Set, EntityTrait};
use chrono::Utc;
use crate::entities::vault::{self, Entity as Vault};
use crate::core::error::AppError;
use super::dto::{VaultDto, CreateVaultDto};

pub struct VaultService;

impl VaultService {
    /// Tạo vault mới
    pub async fn create(
        db: &DatabaseConnection,
        dto: CreateVaultDto,
    ) -> Result<VaultDto, AppError> {
        // 1. VALIDATE - Business rules
        let name = dto.name.trim();
        if name.is_empty() {
            return Err(AppError::Validation("Name cannot be empty".into()));
        }
        if name.len() > 100 {
            return Err(AppError::Validation("Name too long".into()));
        }

        // 2. BUSINESS LOGIC - Prepare data
        let now = Utc::now().naive_utc();
        
        let vault = vault::ActiveModel {
            name: Set(name.to_string()),
            description: Set(dto.description),
            icon: Set(dto.icon.unwrap_or("folder".to_string())),
            color: Set(dto.color.unwrap_or("#3B82F6".to_string())),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };

        // 3. DATABASE - Insert
        let result = vault.insert(db).await?;

        // 4. CONVERT - Model → DTO
        Ok(VaultDto::from(result))
    }

    /// Lấy vault theo ID
    pub async fn get_by_id(
        db: &DatabaseConnection,
        id: i32,
    ) -> Result<VaultDto, AppError> {
        Vault::find_by_id(id)
            .one(db)
            .await?
            .map(VaultDto::from)
            .ok_or(AppError::VaultNotFound(id))
    }

    /// Liệt kê tất cả vaults
    pub async fn list(
        db: &DatabaseConnection,
    ) -> Result<Vec<VaultDto>, AppError> {
        let vaults = Vault::find()
            .all(db)
            .await?;

        Ok(vaults.into_iter().map(VaultDto::from).collect())
    }
}
```

---

## Layer 3: Database (Entities)

> 📍 **Location**: `src/entities/vault.rs`

### Vai trò
- **Define** database schema
- **Provide** type-safe query API
- **Handle** serialization/deserialization

### Ví dụ

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "vaults")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    
    pub name: String,
    
    #[sea_orm(nullable)]
    pub description: Option<String>,
    
    pub icon: String,
    
    pub color: String,
    
    pub created_at: DateTime,
    
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::entry::Entity")]
    Entries,
}

impl Related<super::entry::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Entries.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
```

### SeaORM Generated Methods

```rust
// Entity tự động có các methods:

// SELECT * FROM vaults WHERE id = 1
Vault::find_by_id(1).one(&db).await?;

// SELECT * FROM vaults
Vault::find().all(&db).await?;

// SELECT * FROM vaults WHERE name = 'X'
Vault::find()
    .filter(vault::Column::Name.eq("X"))
    .one(&db)
    .await?;

// INSERT INTO vaults ...
vault_model.insert(&db).await?;

// UPDATE vaults SET ... WHERE id = 1
vault_model.update(&db).await?;

// DELETE FROM vaults WHERE id = 1
vault_model.delete(&db).await?;
```

---

## DTOs (Data Transfer Objects)

> 📍 **Location**: `src/vault/dto.rs`

### Tại sao cần DTO?

| Model (Entity) | DTO |
|----------------|-----|
| Mapping 1:1 với DB | Tùy chỉnh cho API |
| Có thể chứa sensitive data | Chỉ expose data cần thiết |
| Cấu trúc cố định | Có thể khác nhau (Create, Update, Response) |

### Ví dụ

```rust
use serde::{Deserialize, Serialize};
use crate::entities::vault;

/// DTO cho response - trả về frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // Convert to camelCase for JS
pub struct VaultDto {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: String,
    pub created_at: String,  // ISO 8601 string
}

/// Convert từ Entity Model → DTO
impl From<vault::Model> for VaultDto {
    fn from(model: vault::Model) -> Self {
        VaultDto {
            id: model.id,
            name: model.name,
            description: model.description,
            icon: model.icon,
            color: model.color,
            created_at: model.created_at.to_string(),
        }
    }
}

/// DTO cho create request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateVaultDto {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

/// DTO cho update request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateVaultDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}
```

---

## 📝 Tóm tắt

| Layer | Làm | Không làm |
|-------|-----|-----------|
| **Commands** | Nhận input, gọi service, trả response | Business logic, DB queries |
| **Services** | Validate, business logic, call DB | Raw SQL, expose internal models |
| **Entities** | Define schema, CRUD operations | Business logic |

---

## Tiếp theo

➡️ [Tauri Commands](./05-tauri-commands.md) - Chi tiết về IPC và State Management
