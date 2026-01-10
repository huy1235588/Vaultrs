//! Field definition service for business logic.

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};

use crate::core::{AppError, AppResult};
use crate::entities::field_definition::{self, ActiveModel, Entity as FieldDefinition};
use crate::entities::vault::Entity as Vault;

use super::{CreateFieldDto, FieldDefinitionDto, UpdateFieldDto};

/// Service for field definition CRUD operations.
pub struct FieldService;

impl FieldService {
    /// Creates a new field definition for a vault.
    pub async fn create(
        conn: &DatabaseConnection,
        dto: CreateFieldDto,
    ) -> AppResult<FieldDefinitionDto> {
        // Validate name is not empty
        if dto.name.trim().is_empty() {
            return Err(AppError::Validation("Field name is required".to_string()));
        }

        // Verify vault exists
        Vault::find_by_id(dto.vault_id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(dto.vault_id))?;

        // Check for duplicate field name in vault
        let existing = FieldDefinition::find()
            .filter(field_definition::Column::VaultId.eq(dto.vault_id))
            .filter(field_definition::Column::Name.eq(dto.name.trim()))
            .one(conn)
            .await?;

        if existing.is_some() {
            return Err(AppError::Validation(format!(
                "Field '{}' already exists in this vault",
                dto.name.trim()
            )));
        }

        // Get max position for ordering
        let max_position = FieldDefinition::find()
            .filter(field_definition::Column::VaultId.eq(dto.vault_id))
            .order_by_desc(field_definition::Column::Position)
            .one(conn)
            .await?
            .map(|f| f.position + 1)
            .unwrap_or(0);

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let options_json = dto
            .options
            .as_ref()
            .map(|o| serde_json::to_string(o).unwrap_or_default());

        let active_model = ActiveModel {
            vault_id: Set(dto.vault_id),
            name: Set(dto.name.trim().to_string()),
            field_type: Set(dto.field_type.as_str().to_string()),
            options: Set(options_json),
            position: Set(max_position),
            required: Set(if dto.required { 1 } else { 0 }),
            created_at: Set(now.clone()),
            updated_at: Set(now),
            ..Default::default()
        };

        let result = active_model.insert(conn).await?;
        log::info!(
            "Created field definition: {} (id={}) for vault {}",
            result.name,
            result.id,
            result.vault_id
        );

        Ok(FieldDefinitionDto::from(result))
    }

    /// Gets a field definition by ID.
    pub async fn get(conn: &DatabaseConnection, id: i32) -> AppResult<FieldDefinitionDto> {
        let field = FieldDefinition::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::FieldNotFound(id))?;

        Ok(FieldDefinitionDto::from(field))
    }

    /// Lists all field definitions for a vault.
    pub async fn list(
        conn: &DatabaseConnection,
        vault_id: i32,
    ) -> AppResult<Vec<FieldDefinitionDto>> {
        // Verify vault exists
        Vault::find_by_id(vault_id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(vault_id))?;

        let fields = FieldDefinition::find()
            .filter(field_definition::Column::VaultId.eq(vault_id))
            .order_by_asc(field_definition::Column::Position)
            .all(conn)
            .await?;

        Ok(fields.into_iter().map(FieldDefinitionDto::from).collect())
    }

    /// Updates an existing field definition.
    pub async fn update(
        conn: &DatabaseConnection,
        id: i32,
        dto: UpdateFieldDto,
    ) -> AppResult<FieldDefinitionDto> {
        let field = FieldDefinition::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::FieldNotFound(id))?;

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let mut active_model: ActiveModel = field.clone().into();

        if let Some(name) = dto.name {
            if name.trim().is_empty() {
                return Err(AppError::Validation(
                    "Field name cannot be empty".to_string(),
                ));
            }

            // Check for duplicate name (excluding current field)
            let existing = FieldDefinition::find()
                .filter(field_definition::Column::VaultId.eq(field.vault_id))
                .filter(field_definition::Column::Name.eq(name.trim()))
                .filter(field_definition::Column::Id.ne(id))
                .one(conn)
                .await?;

            if existing.is_some() {
                return Err(AppError::Validation(format!(
                    "Field '{}' already exists in this vault",
                    name.trim()
                )));
            }

            active_model.name = Set(name.trim().to_string());
        }

        if let Some(options) = dto.options {
            let options_json = serde_json::to_string(&options).unwrap_or_default();
            active_model.options = Set(Some(options_json));
        }

        if let Some(required) = dto.required {
            active_model.required = Set(if required { 1 } else { 0 });
        }

        active_model.updated_at = Set(now);

        let result = active_model.update(conn).await?;
        log::info!(
            "Updated field definition: {} (id={})",
            result.name,
            result.id
        );

        Ok(FieldDefinitionDto::from(result))
    }

    /// Deletes a field definition.
    pub async fn delete(conn: &DatabaseConnection, id: i32) -> AppResult<()> {
        let field = FieldDefinition::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::FieldNotFound(id))?;

        log::info!(
            "Deleting field definition: {} (id={})",
            field.name,
            field.id
        );

        FieldDefinition::delete_by_id(id).exec(conn).await?;

        Ok(())
    }

    /// Reorders field definitions for a vault.
    pub async fn reorder(conn: &DatabaseConnection, vault_id: i32, ids: Vec<i32>) -> AppResult<()> {
        // Verify vault exists
        Vault::find_by_id(vault_id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(vault_id))?;

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        for (position, id) in ids.into_iter().enumerate() {
            let field = FieldDefinition::find_by_id(id)
                .one(conn)
                .await?
                .ok_or(AppError::FieldNotFound(id))?;

            if field.vault_id != vault_id {
                return Err(AppError::Validation(format!(
                    "Field {} does not belong to vault {}",
                    id, vault_id
                )));
            }

            let mut active_model: ActiveModel = field.into();
            active_model.position = Set(position as i32);
            active_model.updated_at = Set(now.clone());
            active_model.update(conn).await?;
        }

        log::info!("Reordered field definitions for vault {}", vault_id);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::field::FieldType;
    use sea_orm::{Database, DatabaseConnection};

    async fn setup_test_db() -> DatabaseConnection {
        let conn = Database::connect("sqlite::memory:").await.unwrap();

        // Run migrations
        sea_orm::ConnectionTrait::execute_unprepared(
            &conn,
            r#"
            CREATE TABLE vaults (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                color TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE TABLE field_definitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vault_id INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'url', 'boolean', 'select')),
                options TEXT,
                position INTEGER NOT NULL DEFAULT 0,
                required INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(vault_id, name)
            );
            
            INSERT INTO vaults (name, created_at, updated_at) VALUES ('Test Vault', datetime('now'), datetime('now'));
            "#,
        )
        .await
        .unwrap();

        conn
    }

    #[tokio::test]
    async fn test_create_field_definition() {
        let conn = setup_test_db().await;

        let dto = CreateFieldDto {
            vault_id: 1,
            name: "Director".to_string(),
            field_type: FieldType::Text,
            options: None,
            required: false,
        };

        let result = FieldService::create(&conn, dto).await.unwrap();

        assert_eq!(result.name, "Director");
        assert_eq!(result.vault_id, 1);
        assert_eq!(result.field_type, FieldType::Text);
        assert_eq!(result.position, 0);
        assert!(!result.required);
    }

    #[tokio::test]
    async fn test_create_field_duplicate_name() {
        let conn = setup_test_db().await;

        let dto1 = CreateFieldDto {
            vault_id: 1,
            name: "Director".to_string(),
            field_type: FieldType::Text,
            options: None,
            required: false,
        };

        FieldService::create(&conn, dto1).await.unwrap();

        let dto2 = CreateFieldDto {
            vault_id: 1,
            name: "Director".to_string(),
            field_type: FieldType::Text,
            options: None,
            required: false,
        };

        let result = FieldService::create(&conn, dto2).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_fields_ordered() {
        let conn = setup_test_db().await;

        for name in ["Director", "Year", "Genre"] {
            FieldService::create(
                &conn,
                CreateFieldDto {
                    vault_id: 1,
                    name: name.to_string(),
                    field_type: FieldType::Text,
                    options: None,
                    required: false,
                },
            )
            .await
            .unwrap();
        }

        let fields = FieldService::list(&conn, 1).await.unwrap();

        assert_eq!(fields.len(), 3);
        assert_eq!(fields[0].name, "Director");
        assert_eq!(fields[0].position, 0);
        assert_eq!(fields[1].name, "Year");
        assert_eq!(fields[1].position, 1);
        assert_eq!(fields[2].name, "Genre");
        assert_eq!(fields[2].position, 2);
    }

    #[tokio::test]
    async fn test_update_field() {
        let conn = setup_test_db().await;

        let created = FieldService::create(
            &conn,
            CreateFieldDto {
                vault_id: 1,
                name: "Director".to_string(),
                field_type: FieldType::Text,
                options: None,
                required: false,
            },
        )
        .await
        .unwrap();

        let updated = FieldService::update(
            &conn,
            created.id,
            UpdateFieldDto {
                name: Some("Film Director".to_string()),
                options: None,
                required: Some(true),
            },
        )
        .await
        .unwrap();

        assert_eq!(updated.name, "Film Director");
        assert!(updated.required);
    }

    #[tokio::test]
    async fn test_delete_field() {
        let conn = setup_test_db().await;

        let created = FieldService::create(
            &conn,
            CreateFieldDto {
                vault_id: 1,
                name: "Director".to_string(),
                field_type: FieldType::Text,
                options: None,
                required: false,
            },
        )
        .await
        .unwrap();

        FieldService::delete(&conn, created.id).await.unwrap();

        let result = FieldService::get(&conn, created.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_reorder_fields() {
        let conn = setup_test_db().await;

        let mut ids = Vec::new();
        for name in ["A", "B", "C"] {
            let field = FieldService::create(
                &conn,
                CreateFieldDto {
                    vault_id: 1,
                    name: name.to_string(),
                    field_type: FieldType::Text,
                    options: None,
                    required: false,
                },
            )
            .await
            .unwrap();
            ids.push(field.id);
        }

        // Reverse order: C, B, A
        FieldService::reorder(&conn, 1, vec![ids[2], ids[1], ids[0]])
            .await
            .unwrap();

        let fields = FieldService::list(&conn, 1).await.unwrap();
        assert_eq!(fields[0].name, "C");
        assert_eq!(fields[1].name, "B");
        assert_eq!(fields[2].name, "A");
    }
}
