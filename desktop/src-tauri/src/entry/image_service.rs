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

#[cfg(test)]
mod tests {
    use super::*;
    use sea_orm::{ConnectionTrait, Database, DatabaseConnection, EntityTrait};
    use std::fs;

    /// Helper function to create a temporary test image file.
    fn create_test_image(path: &std::path::Path, width: u32, height: u32) -> std::io::Result<()> {
        let img = image::DynamicImage::new_rgb8(width, height);
        img.save(path).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
    }

    async fn setup_test_db() -> DatabaseConnection {
        let conn = Database::connect("sqlite::memory:")
            .await
            .expect("Failed to connect to test database");

        // Create schema
        conn.execute(sea_orm::Statement::from_string(
            sea_orm::DatabaseBackend::Sqlite,
            r#"
            CREATE TABLE vaults (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vault_id INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                metadata TEXT,
                cover_image_path TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            INSERT INTO vaults (name, created_at, updated_at) VALUES ('Test Vault', datetime('now'), datetime('now'));
            "#
                .to_string(),
        ))
        .await
        .unwrap();

        conn
    }

    async fn create_test_entry(conn: &DatabaseConnection) -> i32 {
        use crate::entities::entry::ActiveModel;
        use sea_orm::ActiveModelTrait;

        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let entry = ActiveModel {
            vault_id: Set(1),
            title: Set("Test Entry".to_string()),
            description: Set(None),
            metadata: Set(None),
            cover_image_path: Set(None),
            created_at: Set(now.clone()),
            updated_at: Set(now),
            ..Default::default()
        };

        let result = entry.insert(conn).await.unwrap();
        result.id
    }

    #[tokio::test]
    async fn test_set_cover_from_file() {
        let conn = setup_test_db().await;
        let entry_id = create_test_entry(&conn).await;

        let temp_dir = std::env::temp_dir().join("vaultrs_test_integration");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        // Create a test image
        let test_image = temp_dir.join("test_image.jpg");
        create_test_image(&test_image, 500, 500).unwrap();

        let image_storage = ImageStorage::new(&temp_dir);

        // Set cover from file
        let result = EntryImageService::set_cover_from_file(
            &conn,
            entry_id,
            test_image.to_str().unwrap(),
            &image_storage,
        )
        .await;

        assert!(result.is_ok());
        let entry = result.unwrap();
        assert!(entry.cover_image_path.is_some());
        assert_eq!(entry.cover_image_path.unwrap(), "1/1.jpg");

        // Verify file exists
        let image_path = image_storage.get_full_path("1/1.jpg");
        assert!(image_path.exists());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[tokio::test]
    async fn test_set_cover_from_file_replaces_old_image() {
        let conn = setup_test_db().await;
        let entry_id = create_test_entry(&conn).await;

        let temp_dir = std::env::temp_dir().join("vaultrs_test_integration_replace");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let image_storage = ImageStorage::new(&temp_dir);

        // Set first cover
        let test_image1 = temp_dir.join("test_image1.jpg");
        create_test_image(&test_image1, 500, 500).unwrap();

        EntryImageService::set_cover_from_file(
            &conn,
            entry_id,
            test_image1.to_str().unwrap(),
            &image_storage,
        )
        .await
        .unwrap();

        let first_path = image_storage.get_full_path("1/1.jpg");
        assert!(first_path.exists());

        // Set second cover (should replace first)
        let test_image2 = temp_dir.join("test_image2.png");
        create_test_image(&test_image2, 500, 500).unwrap();

        let result = EntryImageService::set_cover_from_file(
            &conn,
            entry_id,
            test_image2.to_str().unwrap(),
            &image_storage,
        )
        .await;

        assert!(result.is_ok());
        let entry = result.unwrap();
        assert_eq!(entry.cover_image_path.unwrap(), "1/1.png");

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[tokio::test]
    async fn test_set_cover_from_url() {
        let conn = setup_test_db().await;
        let entry_id = create_test_entry(&conn).await;

        let temp_dir = std::env::temp_dir().join("vaultrs_test_url");
        let image_storage = ImageStorage::new(&temp_dir);

        let result = EntryImageService::set_cover_from_url(
            &conn,
            entry_id,
            "https://example.com/image.jpg",
            &image_storage,
        )
        .await;

        assert!(result.is_ok());
        let entry = result.unwrap();
        assert_eq!(
            entry.cover_image_path.unwrap(),
            "https://example.com/image.jpg"
        );
    }

    #[tokio::test]
    async fn test_remove_cover() {
        let conn = setup_test_db().await;
        let entry_id = create_test_entry(&conn).await;

        let temp_dir = std::env::temp_dir().join("vaultrs_test_remove");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let image_storage = ImageStorage::new(&temp_dir);

        // Set cover first
        let test_image = temp_dir.join("test_image.jpg");
        create_test_image(&test_image, 500, 500).unwrap();

        EntryImageService::set_cover_from_file(
            &conn,
            entry_id,
            test_image.to_str().unwrap(),
            &image_storage,
        )
        .await
        .unwrap();

        let image_path = image_storage.get_full_path("1/1.jpg");
        assert!(image_path.exists());

        // Remove cover
        let result = EntryImageService::remove_cover(&conn, entry_id, &image_storage).await;

        assert!(result.is_ok());
        let entry = result.unwrap();
        assert!(entry.cover_image_path.is_none());

        // Verify file is deleted
        assert!(!image_path.exists());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[tokio::test]
    async fn test_get_thumbnail() {
        let conn = setup_test_db().await;
        let entry_id = create_test_entry(&conn).await;

        let temp_dir = std::env::temp_dir().join("vaultrs_test_thumbnail");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let image_storage = ImageStorage::new(&temp_dir);

        // Set cover first
        let test_image = temp_dir.join("test_image.jpg");
        create_test_image(&test_image, 1000, 1000).unwrap();

        let entry = EntryImageService::set_cover_from_file(
            &conn,
            entry_id,
            test_image.to_str().unwrap(),
            &image_storage,
        )
        .await
        .unwrap();

        // Get thumbnail
        let result = EntryImageService::get_thumbnail(&entry, &image_storage);

        assert!(result.is_ok());
        let thumbnail_bytes = result.unwrap();

        // Verify it's a valid JPEG
        assert_eq!(thumbnail_bytes[0], 0xFF);
        assert_eq!(thumbnail_bytes[1], 0xD8);
        assert!(!thumbnail_bytes.is_empty());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[tokio::test]
    async fn test_get_thumbnail_no_cover() {
        let conn = setup_test_db().await;
        let entry_id = create_test_entry(&conn).await;

        let temp_dir = std::env::temp_dir();
        let image_storage = ImageStorage::new(&temp_dir);

        // Get entry without cover
        let entry = Entry::find_by_id(entry_id)
            .one(&conn)
            .await
            .unwrap()
            .unwrap();

        let result = EntryImageService::get_thumbnail(&EntryDto::from(entry), &image_storage);

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_set_cover_nonexistent_entry() {
        let conn = setup_test_db().await;

        let temp_dir = std::env::temp_dir();
        let image_storage = ImageStorage::new(&temp_dir);

        let result = EntryImageService::set_cover_from_url(
            &conn,
            999,
            "https://example.com/image.jpg",
            &image_storage,
        )
        .await;

        assert!(result.is_err());
    }
}
