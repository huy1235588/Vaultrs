//! Entry service for business logic.

use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder, Set,
};

use crate::core::{AppError, AppResult};
use crate::entities::entry::{self, ActiveModel, Entity as Entry};
use crate::entities::vault::Entity as Vault;

use super::{CreateEntryDto, EntryDto, PaginatedEntries, SearchResult, UpdateEntryDto};

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

    /// Searches entries in a vault using full-text search.
    pub async fn search(
        conn: &DatabaseConnection,
        vault_id: i32,
        query: &str,
        page: u64,
        limit: u64,
    ) -> AppResult<SearchResult> {
        // Verify vault exists
        Vault::find_by_id(vault_id)
            .one(conn)
            .await?
            .ok_or(AppError::VaultNotFound(vault_id))?;

        let query = query.trim();

        // Return empty result for empty query
        if query.is_empty() {
            return Ok(SearchResult {
                entries: vec![],
                total: 0,
                query: String::new(),
                page,
                limit,
                has_more: false,
            });
        }

        // Escape special FTS5 characters and add prefix matching
        let search_query = Self::build_fts_query(query);
        let offset = page * limit;

        // Count total matching entries
        let count_sql = format!(
            r#"
            SELECT COUNT(*) as count FROM entries e
            INNER JOIN entries_fts fts ON e.id = fts.rowid
            WHERE e.vault_id = {} AND entries_fts MATCH '{}'
            "#,
            vault_id, search_query
        );

        let count_result = sea_orm::ConnectionTrait::query_one(
            conn,
            sea_orm::Statement::from_string(sea_orm::DatabaseBackend::Sqlite, count_sql),
        )
        .await?;

        let total: i64 = count_result
            .and_then(|row| row.try_get_by_index::<i32>(0).ok())
            .unwrap_or(0) as i64;

        // Get matching entries with pagination
        let search_sql = format!(
            r#"
            SELECT e.id, e.vault_id, e.title, e.description, e.metadata, e.created_at, e.updated_at
            FROM entries e
            INNER JOIN entries_fts fts ON e.id = fts.rowid
            WHERE e.vault_id = {} AND entries_fts MATCH '{}'
            ORDER BY e.created_at DESC
            LIMIT {} OFFSET {}
            "#,
            vault_id, search_query, limit, offset
        );

        let rows = sea_orm::ConnectionTrait::query_all(
            conn,
            sea_orm::Statement::from_string(sea_orm::DatabaseBackend::Sqlite, search_sql),
        )
        .await?;

        let entries: Vec<EntryDto> = rows
            .into_iter()
            .filter_map(|row| {
                Some(EntryDto {
                    id: row.try_get_by_index::<i32>(0).ok()?,
                    vault_id: row.try_get_by_index::<i32>(1).ok()?,
                    title: row.try_get_by_index::<String>(2).ok()?,
                    description: row.try_get_by_index::<Option<String>>(3).ok()?,
                    metadata: row.try_get_by_index::<Option<String>>(4).ok()?,
                    created_at: row.try_get_by_index::<String>(5).ok()?,
                    updated_at: row.try_get_by_index::<String>(6).ok()?,
                })
            })
            .collect();

        let has_more = ((page + 1) * limit) < total as u64;

        log::debug!(
            "Search '{}' in vault {} found {} results",
            query,
            vault_id,
            total
        );

        Ok(SearchResult {
            entries,
            total,
            query: query.to_string(),
            page,
            limit,
            has_more,
        })
    }

    /// Builds FTS5 query with prefix matching.
    /// Escapes special characters and adds * for prefix matching.
    fn build_fts_query(query: &str) -> String {
        // Escape double quotes and wrap each word for prefix matching
        query
            .split_whitespace()
            .map(|word| {
                let escaped = word.replace('"', "\"\"");
                format!("\"{}\"*", escaped)
            })
            .collect::<Vec<_>>()
            .join(" ")
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

    /// Setup test database with FTS5 support for search tests
    async fn setup_test_db_with_fts() -> DatabaseConnection {
        let conn = Database::connect("sqlite::memory:").await.unwrap();

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
            
            CREATE VIRTUAL TABLE entries_fts USING fts5(
                title,
                description,
                content='entries',
                content_rowid='id'
            );
            
            CREATE TRIGGER entries_fts_insert AFTER INSERT ON entries BEGIN
                INSERT INTO entries_fts(rowid, title, description)
                VALUES (new.id, new.title, COALESCE(new.description, ''));
            END;
            
            CREATE TRIGGER entries_fts_delete AFTER DELETE ON entries BEGIN
                INSERT INTO entries_fts(entries_fts, rowid, title, description)
                VALUES ('delete', old.id, old.title, COALESCE(old.description, ''));
            END;
            
            CREATE TRIGGER entries_fts_update AFTER UPDATE ON entries BEGIN
                INSERT INTO entries_fts(entries_fts, rowid, title, description)
                VALUES ('delete', old.id, old.title, COALESCE(old.description, ''));
                INSERT INTO entries_fts(rowid, title, description)
                VALUES (new.id, new.title, COALESCE(new.description, ''));
            END;
            
            INSERT INTO vaults (name, created_at, updated_at) VALUES ('Test Vault', datetime('now'), datetime('now'));
            "#,
        )
        .await
        .unwrap();

        conn
    }

    #[tokio::test]
    async fn test_search_entries_finds_matching() {
        let conn = setup_test_db_with_fts().await;

        // Create test entries
        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "My Movie Collection".to_string(),
                description: Some("All my favorite films".to_string()),
                metadata: None,
            },
        )
        .await
        .unwrap();

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Book Notes".to_string(),
                description: Some("Notes from reading".to_string()),
                metadata: None,
            },
        )
        .await
        .unwrap();

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Travel Photos".to_string(),
                description: Some("Photos from trips".to_string()),
                metadata: None,
            },
        )
        .await
        .unwrap();

        // Search for "movie"
        let result = EntryService::search(&conn, 1, "movie", 0, 10)
            .await
            .unwrap();

        assert_eq!(result.total, 1);
        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.entries[0].title, "My Movie Collection");
        assert_eq!(result.query, "movie");
    }

    #[tokio::test]
    async fn test_search_entries_no_results() {
        let conn = setup_test_db_with_fts().await;

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Test Entry".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        let result = EntryService::search(&conn, 1, "xyz123nonexistent", 0, 10)
            .await
            .unwrap();

        assert_eq!(result.total, 0);
        assert_eq!(result.entries.len(), 0);
    }

    #[tokio::test]
    async fn test_search_entries_prefix_matching() {
        let conn = setup_test_db_with_fts().await;

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Application Settings".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Apple Products".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Banana Recipes".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        // Search for "app" should match "Application" and "Apple" but not "Banana"
        let result = EntryService::search(&conn, 1, "app", 0, 10).await.unwrap();

        assert_eq!(result.total, 2);
        assert!(result
            .entries
            .iter()
            .any(|e| e.title == "Application Settings"));
        assert!(result.entries.iter().any(|e| e.title == "Apple Products"));
    }

    #[tokio::test]
    async fn test_search_entries_case_insensitive() {
        let conn = setup_test_db_with_fts().await;

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "JavaScript Tutorial".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        // Search with lowercase should find entry with mixed case
        let result = EntryService::search(&conn, 1, "javascript", 0, 10)
            .await
            .unwrap();

        assert_eq!(result.total, 1);
        assert_eq!(result.entries[0].title, "JavaScript Tutorial");
    }

    #[tokio::test]
    async fn test_search_entries_empty_query() {
        let conn = setup_test_db_with_fts().await;

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Test Entry".to_string(),
                description: None,
                metadata: None,
            },
        )
        .await
        .unwrap();

        let result = EntryService::search(&conn, 1, "", 0, 10).await.unwrap();

        assert_eq!(result.total, 0);
        assert_eq!(result.entries.len(), 0);
    }

    #[tokio::test]
    async fn test_search_entries_searches_description() {
        let conn = setup_test_db_with_fts().await;

        EntryService::create(
            &conn,
            CreateEntryDto {
                vault_id: 1,
                title: "Random Title".to_string(),
                description: Some("Contains special keyword here".to_string()),
                metadata: None,
            },
        )
        .await
        .unwrap();

        // Search should find entry by description content
        let result = EntryService::search(&conn, 1, "keyword", 0, 10)
            .await
            .unwrap();

        assert_eq!(result.total, 1);
        assert_eq!(result.entries[0].title, "Random Title");
    }
}
