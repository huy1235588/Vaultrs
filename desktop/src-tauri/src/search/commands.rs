//! Tauri commands for full-text search.

use sea_orm::DatabaseConnection;
use tauri::State;

use super::service::{SearchParams, SearchResponse, SearchResult, SearchService};
use crate::core::error::AppError;

/// Full-text search across items with pagination.
#[tauri::command]
pub async fn search_items(
    db: State<'_, DatabaseConnection>,
    params: SearchParams,
) -> Result<SearchResponse, AppError> {
    SearchService::search(&db, params).await
}

/// Quick search for autocomplete/typeahead — returns limited results fast.
#[tauri::command]
pub async fn quick_search(
    db: State<'_, DatabaseConnection>,
    query: String,
    collection_id: Option<i32>,
    limit: Option<u64>,
) -> Result<Vec<SearchResult>, AppError> {
    SearchService::quick_search(&db, query, collection_id, limit).await
}
