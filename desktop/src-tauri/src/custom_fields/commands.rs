//! Tauri commands for attribute (custom field) management.

use sea_orm::DatabaseConnection;
use tauri::State;

use super::models::{CreateAttributeDto, Model, UpdateAttributeDto};
use super::service::AttributeService;
use crate::core::error::AppError;

/// Get all attributes for a collection.
#[tauri::command]
pub async fn get_attributes(
    db: State<'_, DatabaseConnection>,
    collection_id: i32,
) -> Result<Vec<Model>, AppError> {
    AttributeService::get_by_collection(&db, collection_id).await
}

/// Create a new attribute.
#[tauri::command]
pub async fn create_attribute(
    db: State<'_, DatabaseConnection>,
    dto: CreateAttributeDto,
) -> Result<Model, AppError> {
    AttributeService::create(&db, dto).await
}

/// Update an existing attribute.
#[tauri::command]
pub async fn update_attribute(
    db: State<'_, DatabaseConnection>,
    id: i32,
    dto: UpdateAttributeDto,
) -> Result<Model, AppError> {
    AttributeService::update(&db, id, dto).await
}

/// Delete an attribute by ID.
#[tauri::command]
pub async fn delete_attribute(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> Result<(), AppError> {
    AttributeService::delete(&db, id).await
}
