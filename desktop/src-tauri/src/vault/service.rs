//! Vault service for business logic.

use sea_orm::{
    ActiveModelTrait, DatabaseConnection, EntityTrait, QueryOrder, Set,
};

use crate::core::{AppError, AppResult};
use crate::entities::vault::{self, ActiveModel, Entity as Vault};

use super::{CreateVaultDto, UpdateVaultDto, VaultDto};

/// Service for vault CRUD operations.
pub struct VaultService;

impl VaultService {
    /// Creates a new vault.
    pub async fn create(conn: &DatabaseConnection, dto: CreateVaultDto) -> AppResult<VaultDto> {
        // Validate name is not empty
        if dto.name.trim().is_empty() {
            return Err(AppError::Validation("Name is required".to_string()));
        }

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let active_model = ActiveModel {
            name: Set(dto.name.trim().to_string()),
            description: Set(dto.description),
            icon: Set(dto.icon),
            color: Set(dto.color),
            created_at: Set(now.clone()),
            updated_at: Set(now),
            ..Default::default()
        };

        let result = active_model.insert(conn).await?;
        log::info!("Created vault: {} (id={})", result.name, result.id);

        Ok(VaultDto::from(result))
    }

    /// Gets a vault by ID.
    pub async fn get(conn: &DatabaseConnection, id: i32) -> AppResult<VaultDto> {
        let vault = Vault::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(id))?;

        Ok(VaultDto::from(vault))
    }

    /// Lists all vaults ordered by creation date (newest first).
    pub async fn list(conn: &DatabaseConnection) -> AppResult<Vec<VaultDto>> {
        let vaults = Vault::find()
            .order_by_desc(vault::Column::CreatedAt)
            .all(conn)
            .await?;

        Ok(vaults.into_iter().map(VaultDto::from).collect())
    }

    /// Updates an existing vault.
    pub async fn update(
        conn: &DatabaseConnection,
        id: i32,
        dto: UpdateVaultDto,
    ) -> AppResult<VaultDto> {
        let vault = Vault::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(id))?;

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let mut active_model: ActiveModel = vault.into();

        if let Some(name) = dto.name {
            if name.trim().is_empty() {
                return Err(AppError::Validation("Name cannot be empty".to_string()));
            }
            active_model.name = Set(name.trim().to_string());
        }

        if let Some(description) = dto.description {
            active_model.description = Set(Some(description));
        }

        if let Some(icon) = dto.icon {
            active_model.icon = Set(Some(icon));
        }

        if let Some(color) = dto.color {
            active_model.color = Set(Some(color));
        }

        active_model.updated_at = Set(now);

        let result = active_model.update(conn).await?;
        log::info!("Updated vault: {} (id={})", result.name, result.id);

        Ok(VaultDto::from(result))
    }

    /// Deletes a vault and all its entries (cascade).
    pub async fn delete(conn: &DatabaseConnection, id: i32) -> AppResult<()> {
        let vault = Vault::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(id))?;

        log::info!("Deleting vault: {} (id={})", vault.name, vault.id);

        Vault::delete_by_id(id).exec(conn).await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
            "#,
        )
        .await
        .unwrap();

        conn
    }

    #[tokio::test]
    async fn test_create_vault() {
        let conn = setup_test_db().await;

        let dto = CreateVaultDto {
            name: "Test Vault".to_string(),
            description: Some("A test vault".to_string()),
            icon: None,
            color: None,
        };

        let result = VaultService::create(&conn, dto).await.unwrap();

        assert_eq!(result.name, "Test Vault");
        assert_eq!(result.description, Some("A test vault".to_string()));
        assert!(result.id > 0);
    }

    #[tokio::test]
    async fn test_create_vault_empty_name() {
        let conn = setup_test_db().await;

        let dto = CreateVaultDto {
            name: "   ".to_string(),
            description: None,
            icon: None,
            color: None,
        };

        let result = VaultService::create(&conn, dto).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_vault() {
        let conn = setup_test_db().await;

        let create_dto = CreateVaultDto {
            name: "Movies".to_string(),
            description: None,
            icon: None,
            color: None,
        };

        let created = VaultService::create(&conn, create_dto).await.unwrap();
        let fetched = VaultService::get(&conn, created.id).await.unwrap();

        assert_eq!(created.id, fetched.id);
        assert_eq!(created.name, fetched.name);
    }

    #[tokio::test]
    async fn test_list_vaults() {
        let conn = setup_test_db().await;

        VaultService::create(
            &conn,
            CreateVaultDto {
                name: "Movies".to_string(),
                description: None,
                icon: None,
                color: None,
            },
        )
        .await
        .unwrap();

        VaultService::create(
            &conn,
            CreateVaultDto {
                name: "Books".to_string(),
                description: None,
                icon: None,
                color: None,
            },
        )
        .await
        .unwrap();

        let vaults = VaultService::list(&conn).await.unwrap();

        assert_eq!(vaults.len(), 2);
    }

    #[tokio::test]
    async fn test_update_vault() {
        let conn = setup_test_db().await;

        let created = VaultService::create(
            &conn,
            CreateVaultDto {
                name: "Movies".to_string(),
                description: None,
                icon: None,
                color: None,
            },
        )
        .await
        .unwrap();

        let updated = VaultService::update(
            &conn,
            created.id,
            UpdateVaultDto {
                name: Some("Films".to_string()),
                description: None,
                icon: None,
                color: None,
            },
        )
        .await
        .unwrap();

        assert_eq!(updated.name, "Films");
    }

    #[tokio::test]
    async fn test_delete_vault() {
        let conn = setup_test_db().await;

        let created = VaultService::create(
            &conn,
            CreateVaultDto {
                name: "Movies".to_string(),
                description: None,
                icon: None,
                color: None,
            },
        )
        .await
        .unwrap();

        VaultService::delete(&conn, created.id).await.unwrap();

        let result = VaultService::get(&conn, created.id).await;
        assert!(result.is_err());
    }
}
