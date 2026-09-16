//! Tauri commands for item management.

use tauri::State;

use super::models::{
    CreateItemDto, CursorParams, CursorResponse, Model, PaginatedResponse, PaginationParams,
    UpdateItemDto,
};
use super::service::ItemService;
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// Get paginated items for a collection.
#[tauri::command]
pub async fn get_items(
    vault: State<'_, AppVaultState>,
    collection_id: i32,
    params: PaginationParams,
) -> Result<PaginatedResponse<Model>, AppError> {
    let db = vault.get_db().await?;
    ItemService::get_by_collection(&db, collection_id, params).await
}

/// Get items using cursor-based pagination (for infinite scroll).
#[tauri::command]
pub async fn get_items_cursor(
    vault: State<'_, AppVaultState>,
    collection_id: i32,
    params: CursorParams,
) -> Result<CursorResponse<Model>, AppError> {
    let db = vault.get_db().await?;
    ItemService::get_by_collection_cursor(&db, collection_id, params).await
}

/// Get a single item by ID.
#[tauri::command]
pub async fn get_item(
    vault: State<'_, AppVaultState>,
    id: i32,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    ItemService::get_by_id(&db, id).await
}

/// Create a new item.
#[tauri::command]
pub async fn create_item(
    vault: State<'_, AppVaultState>,
    dto: CreateItemDto,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    ItemService::create(&db, dto).await
}

/// Update an existing item.
#[tauri::command]
pub async fn update_item(
    vault: State<'_, AppVaultState>,
    id: i32,
    dto: UpdateItemDto,
) -> Result<Model, AppError> {
    let db = vault.get_db().await?;
    ItemService::update(&db, id, dto).await
}

/// Delete an item by ID.
#[tauri::command]
pub async fn delete_item(
    vault: State<'_, AppVaultState>,
    id: i32,
) -> Result<(), AppError> {
    let db = vault.get_db().await?;
    ItemService::delete(&db, id).await
}
