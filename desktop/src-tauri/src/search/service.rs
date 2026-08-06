//! Search service — FTS5 full-text search business logic.
//!
//! Queries the `items_fts` virtual table (created in the items migration)
//! and JOINs back to `items` to return full Item models.

use sea_orm::{ConnectionTrait, DatabaseConnection, FromQueryResult, Statement};
use serde::{Deserialize, Serialize};

use crate::core::error::AppError;
use crate::core::result::AppResult;
use crate::items::models::Model as ItemModel;

/// Search query parameters.
#[derive(Debug, Deserialize)]
pub struct SearchParams {
    /// The search query string (FTS5 syntax supported).
    pub query: String,
    /// Optional collection filter. If provided, only items in this collection are searched.
    pub collection_id: Option<i32>,
    /// Maximum number of results to return (default: 50, max: 200).
    pub limit: Option<u64>,
    /// Number of results to skip (for pagination).
    pub offset: Option<u64>,
}

/// Search result wrapping an Item with its relevance rank.
#[derive(Debug, Serialize, FromQueryResult)]
pub struct SearchResult {
    pub id: i32,
    pub collection_id: i32,
    pub title: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub properties: String,
    /// FTS5 rank score (lower = more relevant).
    pub rank: f64,
}

/// Search response with total count for pagination.
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub data: Vec<SearchResult>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
}

/// Service for FTS5 search operations.
pub struct SearchService;

impl SearchService {
    /// Search items using FTS5 full-text search.
    ///
    /// The query string supports FTS5 syntax:
    /// - Simple terms: `"batman"` matches items containing "batman"
    /// - Phrase: `"dark knight"` matches the exact phrase
    /// - Prefix: `"bat*"` matches words starting with "bat"
    /// - Boolean: `"batman OR superman"`, `"batman NOT joker"`
    pub async fn search(
        db: &DatabaseConnection,
        params: SearchParams,
    ) -> AppResult<SearchResponse> {
        let limit = params.limit.unwrap_or(50).min(200);
        let offset = params.offset.unwrap_or(0);

        // Sanitize query: trim whitespace, escape if empty
        let query = params.query.trim().to_string();
        if query.is_empty() {
            return Ok(SearchResponse {
                data: vec![],
                total: 0,
                limit,
                offset,
            });
        }

        // Add wildcard suffix for prefix matching (better UX for incremental search)
        // Only if the query doesn't already contain FTS5 operators
        let fts_query = if query.contains('"')
            || query.contains('*')
            || query.contains("OR")
            || query.contains("AND")
            || query.contains("NOT")
            || query.contains("NEAR")
        {
            query.clone()
        } else {
            // Split words and add * suffix to each for prefix matching
            query
                .split_whitespace()
                .map(|word| format!("{word}*"))
                .collect::<Vec<_>>()
                .join(" ")
        };

        // Build query with optional collection filter
        let (count_sql, data_sql, has_collection_filter) = if let Some(_cid) = params.collection_id
        {
            (
                r#"
                SELECT COUNT(*) as count
                FROM items_fts
                JOIN items ON items.id = items_fts.rowid
                WHERE items_fts MATCH ?1
                  AND items.collection_id = ?2
                "#
                .to_string(),
                format!(
                    r#"
                    SELECT items.id, items.collection_id, items.title,
                           items.created_at, items.updated_at, items.properties,
                           rank
                    FROM items_fts
                    JOIN items ON items.id = items_fts.rowid
                    WHERE items_fts MATCH ?1
                      AND items.collection_id = ?2
                    ORDER BY rank
                    LIMIT {limit} OFFSET {offset}
                    "#
                ),
                true,
            )
        } else {
            (
                r#"
                SELECT COUNT(*) as count
                FROM items_fts
                JOIN items ON items.id = items_fts.rowid
                WHERE items_fts MATCH ?1
                "#
                .to_string(),
                format!(
                    r#"
                    SELECT items.id, items.collection_id, items.title,
                           items.created_at, items.updated_at, items.properties,
                           rank
                    FROM items_fts
                    JOIN items ON items.id = items_fts.rowid
                    WHERE items_fts MATCH ?1
                    ORDER BY rank
                    LIMIT {limit} OFFSET {offset}
                    "#
                ),
                false,
            )
        };

        let backend = sea_orm::DatabaseBackend::Sqlite;

        // Get total count
        let count_result = if has_collection_filter {
            db.query_one(Statement::from_sql_and_values(
                backend,
                &count_sql,
                [fts_query.clone().into(), params.collection_id.unwrap().into()],
            ))
            .await?
        } else {
            db.query_one(Statement::from_sql_and_values(
                backend,
                &count_sql,
                [fts_query.clone().into()],
            ))
            .await?
        };

        let total: u64 = count_result
            .map(|row| {
                use sea_orm::QueryResult;
                row.try_get::<i64>("", "count").unwrap_or(0) as u64
            })
            .unwrap_or(0);

        // Get search results
        let results = if has_collection_filter {
            SearchResult::find_by_statement(Statement::from_sql_and_values(
                backend,
                &data_sql,
                [fts_query.into(), params.collection_id.unwrap().into()],
            ))
            .all(db)
            .await?
        } else {
            SearchResult::find_by_statement(Statement::from_sql_and_values(
                backend,
                &data_sql,
                [fts_query.into()],
            ))
            .all(db)
            .await?
        };

        Ok(SearchResponse {
            data: results,
            total,
            limit,
            offset,
        })
    }

    /// Quick search — returns a limited set of results for autocomplete/typeahead.
    /// Optimized for speed: no count query, lower limit.
    pub async fn quick_search(
        db: &DatabaseConnection,
        query: String,
        collection_id: Option<i32>,
        limit: Option<u64>,
    ) -> AppResult<Vec<SearchResult>> {
        let response = Self::search(
            db,
            SearchParams {
                query,
                collection_id,
                limit: Some(limit.unwrap_or(10).min(20)),
                offset: Some(0),
            },
        )
        .await?;

        Ok(response.data)
    }
}
