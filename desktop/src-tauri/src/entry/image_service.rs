//! Entry image service for cover image operations.
//!
//! This service handles all image-related operations for entries:
//! - Setting cover images from local files
//! - Setting cover images from URLs
//! - Removing cover images
//! - Generating thumbnails

use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};

use crate::core::{AppError, AppResult};
use crate::entities::entry::{ActiveModel, Entity as Entry};
use crate::image::{ImageProcessor, ImageStorage};

use super::EntryDto;

/// Service for entry cover image operations.
pub struct EntryImageService;

impl EntryImageService {
    /// Sets the cover image for an entry from a local file.
    pub async fn set_cover_from_file(
        conn: &DatabaseConnection,
        entry_id: i32,
        file_path: &str,
        image_storage: &ImageStorage,
    ) -> AppResult<EntryDto> {
        let entry = Entry::find_by_id(entry_id)
            .one(conn)
            .await?
            .ok_or(AppError::EntryNotFound(entry_id))?;

        // Delete old image if present
        if let Some(old_path) = &entry.cover_image_path {
            let _ = image_storage.delete_image(old_path);
        }

        // Save new image
        let source_path = std::path::Path::new(file_path);
        let relative_path = image_storage.save_local_image(entry.vault_id, entry_id, source_path)?;

        // Update entry
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let mut active_model: ActiveModel = entry.into();
        active_model.cover_image_path = Set(Some(relative_path));
        active_model.updated_at = Set(now);

        let result = active_model.update(conn).await?;
        log::info!("Set cover image for entry {} from file", entry_id);

        Ok(EntryDto::from(result))
    }

    /// Sets the cover image for an entry from a URL.
    pub async fn set_cover_from_url(
        conn: &DatabaseConnection,
        entry_id: i32,
        url: &str,
        image_storage: &ImageStorage,
    ) -> AppResult<EntryDto> {
        let entry = Entry::find_by_id(entry_id)
            .one(conn)
            .await?
            .ok_or(AppError::EntryNotFound(entry_id))?;

        // Delete old image if present and it's a local file
        if let Some(old_path) = &entry.cover_image_path {
            if !old_path.starts_with("http://") && !old_path.starts_with("https://") {
                let _ = image_storage.delete_image(old_path);
            }
        }

        // Store the URL directly without downloading
        // Update entry
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let mut active_model: ActiveModel = entry.into();
        active_model.cover_image_path = Set(Some(url.to_string()));
        active_model.updated_at = Set(now);

        let result = active_model.update(conn).await?;
        log::info!("Set cover image for entry {} from URL", entry_id);

        Ok(EntryDto::from(result))
    }

    /// Removes the cover image from an entry.
    pub async fn remove_cover(
        conn: &DatabaseConnection,
        entry_id: i32,
        image_storage: &ImageStorage,
    ) -> AppResult<EntryDto> {
        let entry = Entry::find_by_id(entry_id)
            .one(conn)
            .await?
            .ok_or(AppError::EntryNotFound(entry_id))?;

        // Delete image if present and it's a local file
        if let Some(old_path) = &entry.cover_image_path {
            if !old_path.starts_with("http://") && !old_path.starts_with("https://") {
                let _ = image_storage.delete_image(old_path);
            }
        }

        // Update entry
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let mut active_model: ActiveModel = entry.into();
        active_model.cover_image_path = Set(None);
        active_model.updated_at = Set(now);

        let result = active_model.update(conn).await?;
        log::info!("Removed cover image from entry {}", entry_id);

        Ok(EntryDto::from(result))
    }

    /// Gets the thumbnail for an entry's cover image.
    pub fn get_thumbnail(
        entry: &EntryDto,
        image_storage: &ImageStorage,
    ) -> AppResult<Vec<u8>> {
        let cover_path = entry
            .cover_image_path
            .as_ref()
            .ok_or(AppError::Validation("Entry has no cover image".to_string()))?;

        let full_path = image_storage.get_full_path(cover_path);

        if !full_path.exists() {
            return Err(AppError::Internal(format!(
                "Cover image file not found: {}",
                cover_path
            )));
        }

        ImageProcessor::generate_thumbnail(&full_path)
    }
}
