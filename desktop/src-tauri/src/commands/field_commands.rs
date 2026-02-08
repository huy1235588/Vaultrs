//! Tauri commands for field definition management.

use sea_orm::DatabaseConnection;
use tauri::State;

use crate::core::AppResult;
use crate::field::{
    CreateFieldDto, FieldDefinitionDto, FieldOptions, FieldService, FieldType, UpdateFieldDto,
};

/// Creates a new field definition for a vault.
#[tauri::command]
pub async fn create_field_definition(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    name: String,
    field_type: FieldType,
    options: Option<FieldOptions>,
    required: Option<bool>,
) -> AppResult<FieldDefinitionDto> {
    let dto = CreateFieldDto {
        vault_id,
        name,
        field_type,
        options,
        required: required.unwrap_or(false),
    };

    FieldService::create(&db, dto).await
}

/// Gets a field definition by ID.
#[tauri::command]
pub async fn get_field_definition(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> AppResult<FieldDefinitionDto> {
    FieldService::get(&db, id).await
}

/// Lists all field definitions for a vault.
#[tauri::command]
pub async fn list_field_definitions(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
) -> AppResult<Vec<FieldDefinitionDto>> {
    FieldService::list(&db, vault_id).await
}

/// Updates an existing field definition.
#[tauri::command]
pub async fn update_field_definition(
    db: State<'_, DatabaseConnection>,
    id: i32,
    name: Option<String>,
    options: Option<FieldOptions>,
    required: Option<bool>,
) -> AppResult<FieldDefinitionDto> {
    let dto = UpdateFieldDto {
        name,
        options,
        required,
    };

    FieldService::update(&db, id, dto).await
}

/// Deletes a field definition.
#[tauri::command]
pub async fn delete_field_definition(
    db: State<'_, DatabaseConnection>,
    id: i32,
) -> AppResult<()> {
    FieldService::delete(&db, id).await
}

/// Reorders field definitions for a vault.
#[tauri::command]
pub async fn reorder_field_definitions(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    ids: Vec<i32>,
) -> AppResult<()> {
    FieldService::reorder(&db, vault_id, ids).await
}
