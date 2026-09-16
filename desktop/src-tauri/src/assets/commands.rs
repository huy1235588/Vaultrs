//! Tauri commands for asset management.

use std::collections::HashMap;
use tauri::State;

use super::models::{AssetWithRole, Model};
use super::service::AssetService;
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Upload a local file as an asset for an item.
#[tauri::command]
pub async fn upload_asset(
    vault: State<'_, AppVaultState>,
    item_id: i32,
    role: String,
    file_path: String,
) -> Result<AssetWithRole, AppError> {
    let db = vault.get_db().await?;
    let storage = vault.get_storage().await?;
    AssetService::create_local(&db, &storage, item_id, &role, &file_path).await
}

/// Add a remote URL as an asset for an item.
#[tauri::command]
pub async fn add_remote_asset(
    vault: State<'_, AppVaultState>,
    item_id: i32,
    role: String,
    url: String,
    original_filename: Option<String>,
) -> Result<AssetWithRole, AppError> {
    let db = vault.get_db().await?;
    AssetService::create_remote(
        &db,
        item_id,
        &role,
        &url,
        original_filename.as_deref(),
    )
    .await
}

/// Get all assets for an item (all roles).
#[tauri::command]
pub async fn get_item_assets(
    vault: State<'_, AppVaultState>,
    item_id: i32,
) -> Result<Vec<AssetWithRole>, AppError> {
    let db = vault.get_db().await?;
    AssetService::get_assets_for_item(&db, item_id).await
}

/// Get the cover asset for an item.
#[tauri::command]
pub async fn get_item_cover(
    vault: State<'_, AppVaultState>,
    item_id: i32,
) -> Result<Option<Model>, AppError> {
    let db = vault.get_db().await?;
    AssetService::get_cover_for_item(&db, item_id).await
}

/// Batch-get cover assets for multiple items (for Grid/List view).
#[tauri::command]
pub async fn get_covers_batch(
    vault: State<'_, AppVaultState>,
    item_ids: Vec<i32>,
) -> Result<HashMap<i32, Option<Model>>, AppError> {
    let db = vault.get_db().await?;
    AssetService::get_covers_batch(&db, &item_ids).await
}

/// Set an existing asset as the cover for an item.
#[tauri::command]
pub async fn set_item_cover(
    vault: State<'_, AppVaultState>,
    item_id: i32,
    asset_id: i32,
) -> Result<(), AppError> {
    let db = vault.get_db().await?;
    AssetService::set_cover(&db, item_id, asset_id).await?;
    Ok(())
}

/// Delete an asset and its files.
#[tauri::command]
pub async fn delete_asset(
    vault: State<'_, AppVaultState>,
    asset_id: i32,
) -> Result<(), AppError> {
    let db = vault.get_db().await?;
    let storage = vault.get_storage().await?;
    AssetService::delete(&db, &storage, asset_id).await
}

/// Unlink an asset from an item (without deleting the asset itself).
#[tauri::command]
pub async fn unlink_asset(
    vault: State<'_, AppVaultState>,
    item_asset_id: i32,
) -> Result<(), AppError> {
    let db = vault.get_db().await?;
    AssetService::unlink(&db, item_asset_id).await
}
