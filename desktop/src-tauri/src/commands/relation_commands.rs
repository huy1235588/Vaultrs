//! Relation commands for cross-vault references.

use std::collections::HashMap;

use sea_orm::DatabaseConnection;
use tauri::State;

use crate::core::AppResult;
use crate::relation::{EntryPickerItem, RelationRef, RelationService, ResolvedRelation};

/// Searches entries in a vault for the relation picker.
///
/// Returns a list of entry summaries matching the search query.
#[tauri::command]
pub async fn search_entries_for_relation(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    query: String,
    limit: Option<i32>,
) -> AppResult<Vec<EntryPickerItem>> {
    let limit = limit.unwrap_or(20);
    RelationService::search_entries_for_picker(&db, vault_id, &query, limit).await
}

/// Resolves multiple relation references in batch.
///
/// Returns a HashMap where keys are "entry_id:vault_id" strings.
#[tauri::command]
pub async fn resolve_relations(
    db: State<'_, DatabaseConnection>,
    relations: Vec<RelationRef>,
) -> AppResult<HashMap<String, ResolvedRelation>> {
    RelationService::resolve_batch(&db, relations).await
}
