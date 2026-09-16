//! Tauri commands for cross-collection item linking.

use tauri::State;

use super::models::{BackReference, ReferenceSearchDto, ReferencedItem, ResolvedReferencesResponse};
use super::service::RelationService;
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Resolve reference IDs stored in an item's properties into enriched item data.
#[tauri::command]
pub async fn resolve_references(
    vault: State<'_, AppVaultState>,
    item_id: i32,
    attribute_keys: Vec<String>,
) -> Result<ResolvedReferencesResponse, AppError> {
    let db = vault.get_db().await?;
    RelationService::resolve_references(&db, item_id, attribute_keys).await
}

/// Search for items in a target collection (for the reference picker UI).
#[tauri::command]
pub async fn search_reference_targets(
    vault: State<'_, AppVaultState>,
    dto: ReferenceSearchDto,
) -> Result<Vec<ReferencedItem>, AppError> {
    let db = vault.get_db().await?;
    RelationService::search_reference_targets(
        &db,
        dto.collection_id,
        dto.query,
        dto.exclude_ids,
        dto.limit,
    )
    .await
}

/// Find all items from other collections that reference a given item.
#[tauri::command]
pub async fn get_back_references(
    vault: State<'_, AppVaultState>,
    item_id: i32,
) -> Result<Vec<BackReference>, AppError> {
    let db = vault.get_db().await?;
    RelationService::get_back_references(&db, item_id).await
}
