//! Tauri commands for full-text search.

use tauri::State;

use super::service::{SearchParams, SearchResponse, SearchResult, SearchService};
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Full-text search across items with pagination.
#[tauri::command]
pub async fn search_items(
    vault: State<'_, AppVaultState>,
    params: SearchParams,
) -> Result<SearchResponse, AppError> {
    let db = vault.get_db().await?;
    SearchService::search(&db, params).await
}

/// Quick search for autocomplete/typeahead — returns limited results fast.
#[tauri::command]
pub async fn quick_search(
    vault: State<'_, AppVaultState>,
    query: String,
    collection_id: Option<i32>,
    limit: Option<u64>,
) -> Result<Vec<SearchResult>, AppError> {
    let db = vault.get_db().await?;
    SearchService::quick_search(&db, query, collection_id, limit).await
}
