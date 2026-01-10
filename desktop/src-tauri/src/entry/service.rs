//! Entry service for business logic.

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, Set,
};

use crate::core::{AppError, AppResult};
use crate::entities::entry::{self, ActiveModel, Entity as Entry};
use crate::entities::vault::Entity as Vault;

use super::{CreateEntryDto, EntryDto, PaginatedEntries, UpdateEntryDto};

/// Service for entry CRUD operations.
pub struct EntryService;

impl EntryService {
    /// Creates a new entry in a vault.
    pub async fn create(conn: &DatabaseConnection, dto: CreateEntryDto) -> AppResult<EntryDto> {
        // Validate title is not empty
        if dto.title.trim().is_empty() {
            return Err(AppError::Validation("Title is required".to_string()));
        }

        // Verify vault exists
        Vault::find_by_id(dto.vault_id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(dto.vault_id))?;

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let active_model = ActiveModel {
            vault_id: Set(dto.vault_id),
            title: Set(dto.title.trim().to_string()),
            description: Set(dto.description),
            metadata: Set(dto.metadata),
            created_at: Set(now.clone()),
            updated_at: Set(now),
            ..Default::default()
        };

        let result = active_model.insert(conn).await?;
        log::info!(
            "Created entry: {} (id={}) in vault {}",
            result.title,
            result.id,
            result.vault_id
        );

        Ok(EntryDto::from(result))
    }

    /// Gets an entry by ID.
    pub async fn get(conn: &DatabaseConnection, id: i32) -> AppResult<EntryDto> {
        let entry = Entry::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::EntryNotFound(id))?;

        Ok(EntryDto::from(entry))
    }

    /// Lists entries for a vault with pagination.
    pub async fn list(
        conn: &DatabaseConnection,
        vault_id: i32,
        page: u64,
        limit: u64,
    ) -> AppResult<PaginatedEntries> {
        // Verify vault exists
        Vault::find_by_id(vault_id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(vault_id))?;

        let paginator = Entry::find()
            .filter(entry::Column::VaultId.eq(vault_id))
            .order_by_desc(entry::Column::CreatedAt)
            .paginate(conn, limit);

        let total = paginator.num_items().await?;
        let entries = paginator.fetch_page(page).await?;

        let has_more = (page + 1) * limit < total as u64;

        Ok(PaginatedEntries {
            entries: entries.into_iter().map(EntryDto::from).collect(),
            total: total as i64,
            page,
            limit,
            has_more,
        })
    }

    /// Counts entries in a vault.
    pub async fn count(conn: &DatabaseConnection, vault_id: i32) -> AppResult<i64> {
        let count = Entry::find()
            .filter(entry::Column::VaultId.eq(vault_id))
            .count(conn)
            .await?;

        Ok(count as i64)
    }

    /// Updates an existing entry.
    pub async fn update(
        conn: &DatabaseConnection,
        id: i32,
        dto: UpdateEntryDto,
    ) -> AppResult<EntryDto> {
        let entry = Entry::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::EntryNotFound(id))?;

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let mut active_model: ActiveModel = entry.into();

        if let Some(title) = dto.title {
            if title.trim().is_empty() {
                return Err(AppError::Validation("Title cannot be empty".to_string()));
            }
            active_model.title = Set(title.trim().to_string());
        }

        if let Some(description) = dto.description {
            active_model.description = Set(Some(description));
        }

        if let Some(metadata) = dto.metadata {
            active_model.metadata = Set(Some(metadata));
        }

        active_model.updated_at = Set(now);

        let result = active_model.update(conn).await?;
        log::info!("Updated entry: {} (id={})", result.title, result.id);

        Ok(EntryDto::from(result))
    }

    /// Deletes an entry.
    pub async fn delete(conn: &DatabaseConnection, id: i32) -> AppResult<()> {
        let entry = Entry::find_by_id(id)
            .one(conn)
            .await?
            .ok_or(AppError::EntryNotFound(id))?;

        log::info!("Deleting entry: {} (id={})", entry.title, entry.id);

        Entry::delete_by_id(id).exec(conn).await?;

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
            
            CREATE TABLE entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vault_id INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                metadata TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            INSERT INTO vaults (name, created_at, updated_at) VALUES ('Test Vault', datetime('now'), datetime('now'));
            "#,
        )
        .await
        .unwrap();

        conn
    }

    #[tokio::test]
    async fn test_create_entry() {
        let conn = setup_test_db().await;

        let dto = CreateEntryDto {
            vault_id: 1,
            title: "Inception".to_string(),
            description: Some("A mind-bending thriller".to_string()),
            metadata: None,
        };

        let result = EntryService::create(&conn, dto).await.unwrap();

        assert_eq!(result.title, "Inception");
        assert_eq!(result.vault_id, 1);
        assert!(result.id > 0);
    }

    #[tokio::test]
    async fn test_create_entry_empty_title() {
        let conn = setup_test_db().await;

        let dto = CreateEntryDto {
            vault_id: 1,
            title: "   ".to_string(),
            description: None,
            metadata: None,
        };

        let result = EntryService::create(&conn, dto).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_entry_invalid_vault() {
        let conn = setup_test_db().await;

        let dto = CreateEntryDto {
            vault_id: 999,
            title: "Test".to_string(),
            description: None,
            metadata: None,
        };

        let result = EntryService::create(&conn, dto).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_entries_pagination() {
        let conn = setup_test_db().await;

        // Create 25 entries
        for i in 0..25 {
            EntryService::create(
                &conn,
                CreateEntryDto {
                    vault_id: 1,
                    title: format!("Entry {}", i),
                    description: None,
                    metadata: None,
                },
            )
            .await
            .unwrap();
        }

        // Get first page
        let page1 = EntryService::list(&conn, 1, 0, 10).await.unwrap();

        assert_eq!(page1.entries.len(), 10);
        assert_eq!(page1.total, 25);
        assert!(page1.has_more);

        // Get last page
        let page3 = EntryService::list(&conn, 1, 2, 10).await.unwrap();

        assert_eq!(page3.entries.len(), 5);
        assert!(!page3.has_more);
    }

    #[tokio::test]
    async fn test_count_entries() {
        let conn = setup_test_db().await;

        // Create 5 entries
        for i in 0..5 {
            EntryService::create(
                &conn,
                CreateEntryDto {
                    vault_id: 1,
                    title: format!("Entry {}", i),
                    description: None,
                    metadata: None,
                },
            )
            .await
            .unwrap();
        }

        let count = EntryService::count(&conn, 1).await.unwrap();

        assert_eq!(count, 5);
    }

    #[tokio::test]
    async fn test_update_entry() {
        let conn = setup_test_db().await;

        let created = EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Inception".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        let updated = EntryService::update(
            &conn,
            created.id,
            UpdateEntryDto {
                title: Some("Inception (2010)".to_string()),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        assert_eq!(updated.title, "Inception (2010)");
    }

    #[tokio::test]
    async fn test_delete_entry() {
        let conn = setup_test_db().await;

        let created = EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Inception".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        EntryService::delete(&conn, created.id).await.unwrap();

        let result = EntryService::get(&conn, created.id).await;
        assert!(result.is_err());
    }
}
