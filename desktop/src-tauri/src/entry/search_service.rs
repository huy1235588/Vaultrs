//! Entry search service for full-text search operations.
//!
//! This service handles all search-related operations for entries:
//! - Full-text search using SQLite FTS5
//! - Search query building with prefix matching

use sea_orm::DatabaseConnection;

use crate::core::{AppError, AppResult};
use crate::entities::vault::Entity as Vault;
use sea_orm::EntityTrait;

use super::{EntryDto, SearchResult};

/// Service for entry search operations.
pub struct EntrySearchService;

impl EntrySearchService {
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
            SELECT e.id, e.vault_id, e.title, e.description, e.metadata, e.cover_image_path, e.created_at, e.updated_at
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
                    cover_image_path: row.try_get_by_index::<Option<String>>(5).ok()?,
                    created_at: row.try_get_by_index::<String>(6).ok()?,
                    updated_at: row.try_get_by_index::<String>(7).ok()?,
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
    pub fn build_fts_query(query: &str) -> String {
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

    #[test]
    fn test_build_fts_query_single_word() {
        let result = EntrySearchService::build_fts_query("test");
        assert_eq!(result, "\"test\"*");
    }

    #[test]
    fn test_build_fts_query_multiple_words() {
        let result = EntrySearchService::build_fts_query("hello world");
        assert_eq!(result, "\"hello\"* \"world\"*");
    }

    #[test]
    fn test_build_fts_query_with_quotes() {
        let result = EntrySearchService::build_fts_query("test\"query");
        assert_eq!(result, "\"test\"\"query\"*");
    }

    #[test]
    fn test_build_fts_query_empty() {
        let result = EntrySearchService::build_fts_query("");
        assert_eq!(result, "");
    }
}
