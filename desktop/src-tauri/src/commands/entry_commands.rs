//! Entry-related Tauri commands.

use sea_orm::DatabaseConnection;
use tauri::State;

use crate::core::AppError;
use crate::entry::{
    CreateEntryDto, EntryDto, EntrySearchService, EntryService, PaginatedEntries, SearchResult,
    UpdateEntryDto,
};
use crate::image::ImageStorage;

/// Creates a new entry in a vault.
#[tauri::command]
pub async fn create_entry(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    title: String,
    description: Option<String>,
    metadata: Option<String>,
) -> Result<EntryDto, AppError> {
    let dto = CreateEntryDto {
        vault_id,
        title,
        description,
        metadata,
    };

    EntryService::create(&db, dto).await
}

/// Gets an entry by ID.
#[tauri::command]
pub async fn get_entry(db: State<'_, DatabaseConnection>, id: i32) -> Result<EntryDto, AppError> {
    EntryService::get(&db, id).await
}

/// Lists entries for a vault with pagination.
#[tauri::command]
pub async fn list_entries(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    page: u64,
    limit: u64,
) -> Result<PaginatedEntries, AppError> {
    EntryService::list(&db, vault_id, page, limit).await
}

/// Counts entries in a vault.
#[tauri::command]
pub async fn count_entries(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
) -> Result<i64, AppError> {
    EntryService::count(&db, vault_id).await
}

/// Updates an existing entry.
#[tauri::command]
pub async fn update_entry(
    db: State<'_, DatabaseConnection>,
    id: i32,
    title: Option<String>,
    description: Option<String>,
    metadata: Option<String>,
) -> Result<EntryDto, AppError> {
    let dto = UpdateEntryDto {
        title,
        description,
        metadata,
    };

    EntryService::update(&db, id, dto).await
}

/// Deletes an entry and its cover image.
#[tauri::command]
pub async fn delete_entry(
    db: State<'_, DatabaseConnection>,
    id: i32,
    app_data_dir: String,
) -> Result<(), AppError> {
    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));
    EntryService::delete(&db, id, Some(&image_storage)).await
}

/// Searches entries in a vault using full-text search.
#[tauri::command]
pub async fn search_entries(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    query: String,
    page: u64,
    limit: u64,
) -> Result<SearchResult, AppError> {
    EntrySearchService::search(&db, vault_id, &query, page, limit).await
}
