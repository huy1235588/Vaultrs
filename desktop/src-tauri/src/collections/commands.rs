//! Tauri commands for collection management.

use sea_orm::DatabaseConnection;
use tauri::State;

use super::models::{CreateCollectionDto, Model, UpdateCollectionDto};
use super::service::CollectionService;
use crate::core::error::AppError;

/// Get all collections.
#[tauri::command]
pub async fn get_collections(
    db: State<'_, DatabaseConnection>,
) -> Result<Vec<Model>, AppError> {
    CollectionService::get_all(&db).await
}

/// Get a single collection by ID.
#[tauri::command]
pub async fn get_collection(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> Result<Model, AppError> {
    CollectionService::get_by_id(&db, id).await
}

/// Create a new collection.
#[tauri::command]
pub async fn create_collection(
    db: State<'_, DatabaseConnection>,
    dto: CreateCollectionDto,
) -> Result<Model, AppError> {
    CollectionService::create(&db, dto).await
}

/// Update an existing collection.
#[tauri::command]
pub async fn update_collection(
    db: State<'_, DatabaseConnection>,
    id: i32,
    dto: UpdateCollectionDto,
) -> Result<Model, AppError> {
    CollectionService::update(&db, id, dto).await
}

/// Delete a collection by ID.
#[tauri::command]
pub async fn delete_collection(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> Result<(), AppError> {
    CollectionService::delete(&db, id).await
}
