//! Image management Tauri commands.

use sea_orm::DatabaseConnection;
use tauri::State;

use crate::core::AppResult;
use crate::entry::{EntryDto, EntryService};
use crate::image::{ImageProcessor, ImageStorage};

/// Uploads an entry cover image from a local file.
#[tauri::command]
pub async fn upload_entry_cover_image(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    file_path: String,
    app_data_dir: String,
) -> AppResult<EntryDto> {
    log::info!(
        "Uploading cover image for entry {} from file: {}",
        entry_id,
        file_path
    );

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    EntryService::set_cover_from_file(&db, entry_id, &file_path, &image_storage).await
}

/// Sets an entry cover image from a URL.
#[tauri::command]
pub async fn set_entry_cover_url(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    url: String,
    app_data_dir: String,
) -> AppResult<EntryDto> {
    log::info!(
        "Setting cover image for entry {} from URL: {}",
        entry_id,
        url
    );

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    EntryService::set_cover_from_url(&db, entry_id, &url, &image_storage).await
}

/// Gets the thumbnail for an entry's cover image as a base64-encoded data URL.
#[tauri::command]
pub async fn get_entry_thumbnail(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    app_data_dir: String,
) -> AppResult<String> {
    log::debug!("Getting thumbnail for entry {}", entry_id);

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    // Get entry
    let entry = EntryService::get(&db, entry_id).await?;

    // Generate thumbnail
    let thumbnail_bytes = EntryService::get_thumbnail(&entry, &image_storage)?;

    // Convert to data URL for frontend
    Ok(ImageProcessor::to_data_url(&thumbnail_bytes))
}

/// Removes the cover image from an entry.
#[tauri::command]
pub async fn remove_entry_cover(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    app_data_dir: String,
) -> AppResult<EntryDto> {
    log::info!("Removing cover image from entry {}", entry_id);

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    EntryService::remove_cover(&db, entry_id, &image_storage).await
}
