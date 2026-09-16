//! Tauri commands for collection settings.

use tauri::State;

use super::models::{ParsedSettings, UpdateSettingsDto};
use super::service::CollectionSettingsService;
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Get settings for a collection (parsed into typed DTOs).
#[tauri::command]
pub async fn get_collection_settings(
    vault: State<'_, AppVaultState>,
    collection_id: i32,
) -> Result<ParsedSettings, AppError> {
    let db = vault.get_db().await?;
    CollectionSettingsService::get_by_collection(&db, collection_id).await
}

/// Update settings for a collection.
#[tauri::command]
pub async fn update_collection_settings(
    vault: State<'_, AppVaultState>,
    collection_id: i32,
    dto: UpdateSettingsDto,
) -> Result<ParsedSettings, AppError> {
    let db = vault.get_db().await?;
    CollectionSettingsService::update(&db, collection_id, dto).await
}
