//! Tauri commands for collection management.

use tauri::State;

use super::models::{CreateCollectionDto, Model, UpdateCollectionDto};
use super::service::CollectionService;
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Get all collections.
#[tauri::command]
pub async fn get_collections(
    vault: State<'_, AppVaultState>,
) -> Result<Vec<Model>, AppError> {
    let db = vault.get_db().await?;
    CollectionService::get_all(&db).await
}

/// Get a single collection by ID.
#[tauri::command]
pub async fn get_collection(
    vault: State<'_, AppVaultState>,
    id: i32,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    CollectionService::get_by_id(&db, id).await
}

/// Create a new collection.
#[tauri::command]
pub async fn create_collection(
    vault: State<'_, AppVaultState>,
    dto: CreateCollectionDto,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    CollectionService::create(&db, dto).await
}

/// Update an existing collection.
#[tauri::command]
pub async fn update_collection(
    vault: State<'_, AppVaultState>,
    id: i32,
    dto: UpdateCollectionDto,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    CollectionService::update(&db, id, dto).await
}

/// Delete a collection by ID.
#[tauri::command]
pub async fn delete_collection(
    vault: State<'_, AppVaultState>,
    id: i32,
) -> Result<(), AppError> {
    let db = vault.get_db().await?;
    CollectionService::delete(&db, id).await
}
