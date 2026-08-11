//! Tauri commands for collection settings.

use sea_orm::DatabaseConnection;
use tauri::State;

use super::models::{ParsedSettings, UpdateSettingsDto};
use super::service::CollectionSettingsService;
use crate::core::error::AppError;

/// Get settings for a collection (parsed into typed DTOs).
#[tauri::command]
pub async fn get_collection_settings(
    db: State<'_, DatabaseConnection>,
    collection_id: i32,
) -> Result<ParsedSettings, AppError> {
    CollectionSettingsService::get_by_collection(&db, collection_id).await
}

/// Update settings for a collection.
#[tauri::command]
pub async fn update_collection_settings(
    db: State<'_, DatabaseConnection>,
    collection_id: i32,
    dto: UpdateSettingsDto,
) -> Result<ParsedSettings, AppError> {
    CollectionSettingsService::update(&db, collection_id, dto).await
}
