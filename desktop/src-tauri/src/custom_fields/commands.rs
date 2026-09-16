//! Tauri commands for attribute (custom field) management.

use tauri::State;

use super::models::{CreateAttributeDto, Model, UpdateAttributeDto};
use super::service::AttributeService;
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Get all attributes for a collection.
#[tauri::command]
pub async fn get_attributes(
    vault: State<'_, AppVaultState>,
    collection_id: i32,
) -> Result<Vec<Model>, AppError> {
    let db = vault.get_db().await?;
    AttributeService::get_by_collection(&db, collection_id).await
}

/// Create a new attribute.
#[tauri::command]
pub async fn create_attribute(
    vault: State<'_, AppVaultState>,
    dto: CreateAttributeDto,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    AttributeService::create(&db, dto).await
}

/// Update an existing attribute.
#[tauri::command]
pub async fn update_attribute(
    vault: State<'_, AppVaultState>,
    id: i32,
    dto: UpdateAttributeDto,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    AttributeService::update(&db, id, dto).await
}

/// Delete an attribute by ID.
#[tauri::command]
pub async fn delete_attribute(
    vault: State<'_, AppVaultState>,
    id: i32,
) -> Result<(), AppError> {
    let db = vault.get_db().await?;
    AttributeService::delete(&db, id).await
}
