//! Tauri commands for item management.

use sea_orm::DatabaseConnection;
use tauri::State;

use super::models::{
    CreateItemDto, CursorParams, CursorResponse, Model, PaginatedResponse, PaginationParams,
    UpdateItemDto,
};
use super::service::ItemService;
use crate::core::error::AppError;

/// Get paginated items for a collection.
#[tauri::command]
pub async fn get_items(
    db: State<'_, DatabaseConnection>,
    collection_id: i32,
    params: PaginationParams,
) -> Result<PaginatedResponse<Model>, AppError> {
    ItemService::get_by_collection(&db, collection_id, params).await
}

/// Get items using cursor-based pagination (for infinite scroll).
#[tauri::command]
pub async fn get_items_cursor(
    db: State<'_, DatabaseConnection>,
    collection_id: i32,
    params: CursorParams,
) -> Result<CursorResponse<Model>, AppError> {
    ItemService::get_by_collection_cursor(&db, collection_id, params).await
}

/// Get a single item by ID.
#[tauri::command]
pub async fn get_item(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> Result<Model, AppError> {
    ItemService::get_by_id(&db, id).await
}

/// Create a new item.
#[tauri::command]
pub async fn create_item(
    db: State<'_, DatabaseConnection>,
    dto: CreateItemDto,
) -> Result<Model, AppError> {
    ItemService::create(&db, dto).await
}

/// Update an existing item.
#[tauri::command]
pub async fn update_item(
    db: State<'_, DatabaseConnection>,
    id: i32,
    dto: UpdateItemDto,
) -> Result<Model, AppError> {
    ItemService::update(&db, id, dto).await
}

/// Delete an item by ID.
#[tauri::command]
pub async fn delete_item(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> Result<(), AppError> {
    ItemService::delete(&db, id).await
}
