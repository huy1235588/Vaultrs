# 8. Coding Examples

> ⏱️ **Thời gian đọc**: 30 phút

---

## 8.1 Full Example: Create Vault

### Command
```rust
// src/commands/vault_commands.rs
#[tauri::command]
pub async fn create_vault(
    db: State<'_, DatabaseConnection>,
    name: String,
    description: Option<String>,
) -> Result<VaultDto, AppError> {
    let dto = CreateVaultDto { name, description, icon: None, color: None };
    VaultService::create(&db, dto).await
}
```

### Service
```rust
// src/vault/service.rs
impl VaultService {
    pub async fn create(db: &DatabaseConnection, dto: CreateVaultDto) -> Result<VaultDto, AppError> {
        // Validate
        if dto.name.trim().is_empty() {
            return Err(AppError::Validation("Name required".into()));
        }

        // Insert
        let vault = vault::ActiveModel {
            name: Set(dto.name.trim().to_string()),
            description: Set(dto.description),
            icon: Set(dto.icon.unwrap_or("folder".into())),
            color: Set(dto.color.unwrap_or("#3B82F6".into())),
            created_at: Set(Utc::now().naive_utc()),
            updated_at: Set(Utc::now().naive_utc()),
            ..Default::default()
        };

        let result = vault.insert(db).await?;
        Ok(VaultDto::from(result))
    }
}
```

### Frontend
```typescript
const vault = await invoke<VaultDto>('create_vault', {
    name: 'My Vault',
    description: 'Description here'
});
```

---

## 8.2 Full Example: List with Pagination

### Command
```rust
#[tauri::command]
pub async fn list_vaults(
    db: State<'_, DatabaseConnection>,
    page: Option<u64>,
    page_size: Option<u64>,
) -> Result<PaginatedResponse<VaultDto>, AppError> {
    VaultService::list(&db, page.unwrap_or(0), page_size.unwrap_or(20)).await
}
```

### Service
```rust
impl VaultService {
    pub async fn list(
        db: &DatabaseConnection,
        page: u64,
        page_size: u64,
    ) -> Result<PaginatedResponse<VaultDto>, AppError> {
        let paginator = Vault::find()
            .order_by_desc(Column::UpdatedAt)
            .paginate(db, page_size);

        let total = paginator.num_items().await?;
        let items = paginator.fetch_page(page).await?;

        Ok(PaginatedResponse {
            items: items.into_iter().map(VaultDto::from).collect(),
            total,
            page,
            page_size,
        })
    }
}
```

---

## 8.3 Full Example: Update Vault

### Command
```rust
#[tauri::command]
pub async fn update_vault(
    db: State<'_, DatabaseConnection>,
    id: i32,
    name: Option<String>,
    description: Option<String>,
) -> Result<VaultDto, AppError> {
    VaultService::update(&db, id, UpdateVaultDto { name, description, icon: None, color: None }).await
}
```

### Service
```rust
impl VaultService {
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        dto: UpdateVaultDto,
    ) -> Result<VaultDto, AppError> {
        // Find
        let vault = Vault::find_by_id(id)
            .one(db).await?
            .ok_or(AppError::VaultNotFound(id))?;

        // Update
        let mut vault: vault::ActiveModel = vault.into();
        if let Some(name) = dto.name {
            vault.name = Set(name);
        }
        if let Some(desc) = dto.description {
            vault.description = Set(Some(desc));
        }
        vault.updated_at = Set(Utc::now().naive_utc());

        let result = vault.update(db).await?;
        Ok(VaultDto::from(result))
    }
}
```

---

## 8.4 Full Example: Delete Vault

```rust
#[tauri::command]
pub async fn delete_vault(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> Result<(), AppError> {
    VaultService::delete(&db, id).await
}

impl VaultService {
    pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
        let result = Vault::delete_by_id(id).exec(db).await?;
        if result.rows_affected == 0 {
            return Err(AppError::VaultNotFound(id));
        }
        Ok(())
    }
}
```

---

## Tiếp theo

➡️ [Roadmap Học Tập](./09-roadmap.md)
