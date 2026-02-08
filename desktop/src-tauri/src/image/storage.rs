//! Image storage management for file system operations.

use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::core::{AppError, AppResult};

/// Maximum allowed image file size (10MB).
const MAX_IMAGE_SIZE: u64 = 10 * 1024 * 1024;

/// Timeout for URL downloads (30 seconds).
#[allow(dead_code)]
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(30);

/// Image storage handler.
pub struct ImageStorage {
    images_dir: PathBuf,
}

impl ImageStorage {
    /// Creates a new ImageStorage instance with the given app data directory.
    pub fn new(app_data_dir: &Path) -> Self {
        let images_dir = app_data_dir.join("images");
        Self { images_dir }
    }

    /// Gets the path for an entry's cover image.
    fn get_image_path(&self, vault_id: i32, entry_id: i32, extension: &str) -> PathBuf {
        self.images_dir
            .join(vault_id.to_string())
            .join(format!("{}.{}", entry_id, extension))
    }

    /// Gets the vault directory path.
    fn get_vault_dir(&self, vault_id: i32) -> PathBuf {
        self.images_dir.join(vault_id.to_string())
    }

    /// Ensures the vault directory exists.
    fn ensure_vault_dir(&self, vault_id: i32) -> AppResult<()> {
        let vault_dir = self.get_vault_dir(vault_id);
        if !vault_dir.exists() {
            std::fs::create_dir_all(&vault_dir).map_err(|e| {
                AppError::Internal(format!("Failed to create vault image directory: {}", e))
            })?;
        }
        Ok(())
    }

    /// Validates image file size.
    fn validate_file_size(path: &Path) -> AppResult<()> {
        let metadata = std::fs::metadata(path)
            .map_err(|e| AppError::Internal(format!("Failed to read file metadata: {}", e)))?;

        if metadata.len() > MAX_IMAGE_SIZE {
            return Err(AppError::Validation(format!(
                "Image size exceeds 10MB limit ({}MB)",
                metadata.len() / (1024 * 1024)
            )));
        }

        Ok(())
    }

    /// Detects the image format and returns the file extension.
    fn detect_format(path: &Path) -> AppResult<String> {
        let format = image::ImageReader::open(path)
            .map_err(|e| AppError::Validation(format!("Failed to read image file: {}", e)))?
            .format();

        match format {
            Some(image::ImageFormat::Jpeg) => Ok("jpg".to_string()),
            Some(image::ImageFormat::Png) => Ok("png".to_string()),
            Some(image::ImageFormat::WebP) => Ok("webp".to_string()),
            Some(image::ImageFormat::Gif) => Ok("gif".to_string()),
            _ => Err(AppError::Validation(
                "Invalid image format. Supported: JPEG, PNG, WebP, GIF".to_string(),
            )),
        }
    }

    /// Saves a local image file to the storage.
    pub fn save_local_image(
        &self,
        vault_id: i32,
        entry_id: i32,
        source_path: &Path,
    ) -> AppResult<String> {
        log::info!(
            "Saving local image for vault {} entry {}",
            vault_id,
            entry_id
        );

        // Validate file size
        Self::validate_file_size(source_path)?;

        // Detect image format
        let extension = Self::detect_format(source_path)?;

        // Ensure vault directory exists
        self.ensure_vault_dir(vault_id)?;

        // Get destination path
        let dest_path = self.get_image_path(vault_id, entry_id, &extension);

        // Copy file to destination
        std::fs::copy(source_path, &dest_path).map_err(|e| {
            AppError::Internal(format!("Failed to copy image file: {}", e))
        })?;

        // Return relative path
        let relative_path = format!("{}/{}.{}", vault_id, entry_id, extension);
        log::info!("Image saved to: {}", relative_path);

        Ok(relative_path)
    }

    /// Downloads an image from a URL and saves it to storage.
    #[allow(dead_code)]
    pub async fn download_and_save_image(
        &self,
        vault_id: i32,
        entry_id: i32,
        url: &str,
    ) -> AppResult<String> {
        log::info!(
            "Downloading image from URL for vault {} entry {}: {}",
            vault_id,
            entry_id,
            url
        );

        // Create HTTP client with timeout
        let client = reqwest::Client::builder()
            .timeout(DOWNLOAD_TIMEOUT)
            .build()
            .map_err(|e| AppError::Internal(format!("Failed to create HTTP client: {}", e)))?;

        // Download the image
        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| AppError::Validation(format!("Failed to download image from URL: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Validation(format!(
                "Failed to download image: HTTP {}",
                response.status()
            )));
        }

        // Check content length if available
        if let Some(content_length) = response.content_length() {
            if content_length > MAX_IMAGE_SIZE {
                return Err(AppError::Validation(format!(
                    "Image size exceeds 10MB limit ({}MB)",
                    content_length / (1024 * 1024)
                )));
            }
        }

        // Download to temporary file
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join(format!("vaultrs_temp_{}_{}.tmp", vault_id, entry_id));

        let bytes: bytes::Bytes = response
            .bytes()
            .await
            .map_err(|e| AppError::Validation(format!("Failed to download image data: {}", e)))?;

        // Check size after download
        if bytes.len() as u64 > MAX_IMAGE_SIZE {
            return Err(AppError::Validation(format!(
                "Image size exceeds 10MB limit ({}MB)",
                bytes.len() / (1024 * 1024)
            )));
        }

        std::fs::write(&temp_path, bytes)
            .map_err(|e| AppError::Internal(format!("Failed to write temporary file: {}", e)))?;

        // Validate and detect format
        let extension = Self::detect_format(&temp_path)?;

        // Ensure vault directory exists
        self.ensure_vault_dir(vault_id)?;

        // Get destination path
        let dest_path = self.get_image_path(vault_id, entry_id, &extension);

        // Move temp file to final location
        std::fs::rename(&temp_path, &dest_path).map_err(|e| {
            // Clean up temp file on error
            let _ = std::fs::remove_file(&temp_path);
            AppError::Internal(format!("Failed to move image to final location: {}", e))
        })?;

        // Return relative path
        let relative_path = format!("{}/{}.{}", vault_id, entry_id, extension);
        log::info!("Image downloaded and saved to: {}", relative_path);

        Ok(relative_path)
    }

    /// Deletes an image from storage.
    pub fn delete_image(&self, relative_path: &str) -> AppResult<()> {
        log::info!("Deleting image: {}", relative_path);

        let full_path = self.images_dir.join(relative_path);

        if full_path.exists() {
            std::fs::remove_file(&full_path).map_err(|e| {
                log::warn!("Failed to delete image file: {}", e);
                AppError::Internal(format!("Failed to delete image file: {}", e))
            })?;
            log::info!("Image deleted successfully");
        } else {
            log::warn!("Image file not found: {}", relative_path);
        }

        Ok(())
    }

    /// Gets the full path for an image given its relative path.
    pub fn get_full_path(&self, relative_path: &str) -> PathBuf {
        self.images_dir.join(relative_path)
    }

    /// Checks if an image exists.
    #[allow(dead_code)]
    pub fn image_exists(&self, relative_path: &str) -> bool {
        self.get_full_path(relative_path).exists()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;

    /// Helper function to create a temporary test image file.
    fn create_test_image(path: &Path, width: u32, height: u32, format: image::ImageFormat) -> std::io::Result<()> {
        let img = image::DynamicImage::new_rgb8(width, height);
        let mut file = fs::File::create(path)?;

        match format {
            image::ImageFormat::Jpeg => {
                let mut buffer = std::io::Cursor::new(Vec::new());
                img.write_to(&mut buffer, format).unwrap();
                file.write_all(&buffer.into_inner())?;
            }
            image::ImageFormat::Png => {
                let mut buffer = std::io::Cursor::new(Vec::new());
                img.write_to(&mut buffer, format).unwrap();
                file.write_all(&buffer.into_inner())?;
            }
            image::ImageFormat::WebP => {
                let mut buffer = std::io::Cursor::new(Vec::new());
                img.write_to(&mut buffer, format).unwrap();
                file.write_all(&buffer.into_inner())?;
            }
            image::ImageFormat::Gif => {
                let mut buffer = std::io::Cursor::new(Vec::new());
                img.write_to(&mut buffer, format).unwrap();
                file.write_all(&buffer.into_inner())?;
            }
            _ => {}
        }

        Ok(())
    }

    #[test]
    fn test_get_image_path() {
        let temp_dir = std::env::temp_dir();
        let storage = ImageStorage::new(&temp_dir);

        let path = storage.get_image_path(1, 42, "jpg");
        assert!(path.to_string_lossy().contains("images"));
        assert!(path.to_string_lossy().contains("1"));
        assert!(path.to_string_lossy().contains("42.jpg"));
    }

    #[test]
    fn test_get_vault_dir() {
        let temp_dir = std::env::temp_dir();
        let storage = ImageStorage::new(&temp_dir);

        let vault_dir = storage.get_vault_dir(5);
        assert!(vault_dir.to_string_lossy().contains("images"));
        assert!(vault_dir.to_string_lossy().ends_with("5"));
    }

    #[test]
    fn test_ensure_vault_dir_creates_directory() {
        let temp_dir = std::env::temp_dir().join("vaultrs_test_ensure_dir");
        let storage = ImageStorage::new(&temp_dir);

        // Clean up any existing test directory
        let _ = fs::remove_dir_all(&temp_dir);

        let vault_dir = storage.get_vault_dir(99);
        assert!(!vault_dir.exists());

        storage.ensure_vault_dir(99).unwrap();
        assert!(vault_dir.exists());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_detect_format_jpeg() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_detect_jpeg.jpg");

        create_test_image(&test_file, 100, 100, image::ImageFormat::Jpeg).unwrap();

        let format = ImageStorage::detect_format(&test_file).unwrap();
        assert_eq!(format, "jpg");

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_detect_format_png() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_detect_png.png");

        create_test_image(&test_file, 100, 100, image::ImageFormat::Png).unwrap();

        let format = ImageStorage::detect_format(&test_file).unwrap();
        assert_eq!(format, "png");

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_detect_format_webp() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_detect_webp.webp");

        create_test_image(&test_file, 100, 100, image::ImageFormat::WebP).unwrap();

        let format = ImageStorage::detect_format(&test_file).unwrap();
        assert_eq!(format, "webp");

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_detect_format_invalid_file() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_invalid.txt");

        fs::write(&test_file, b"not an image").unwrap();

        let result = ImageStorage::detect_format(&test_file);
        assert!(result.is_err());

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_validate_file_size_within_limit() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_size_ok.jpg");

        create_test_image(&test_file, 100, 100, image::ImageFormat::Jpeg).unwrap();

        let result = ImageStorage::validate_file_size(&test_file);
        assert!(result.is_ok());

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_save_local_image_success() {
        let temp_dir = std::env::temp_dir().join("vaultrs_test_save");
        let storage = ImageStorage::new(&temp_dir);

        // Clean up any existing test directory
        let _ = fs::remove_dir_all(&temp_dir);

        // Create a test source image
        let source_file = temp_dir.join("source.jpg");
        fs::create_dir_all(&temp_dir).unwrap();
        create_test_image(&source_file, 200, 200, image::ImageFormat::Jpeg).unwrap();

        // Save the image
        let result = storage.save_local_image(1, 100, &source_file);
        assert!(result.is_ok());

        let relative_path = result.unwrap();
        assert_eq!(relative_path, "1/100.jpg");

        // Verify the file exists at the destination
        let dest_path = storage.get_full_path(&relative_path);
        assert!(dest_path.exists());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_delete_image_existing() {
        let temp_dir = std::env::temp_dir().join("vaultrs_test_delete");
        let storage = ImageStorage::new(&temp_dir);

        // Clean up any existing test directory
        let _ = fs::remove_dir_all(&temp_dir);

        // Create a test image
        let vault_dir = temp_dir.join("images").join("1");
        fs::create_dir_all(&vault_dir).unwrap();
        let test_file = vault_dir.join("42.jpg");
        create_test_image(&test_file, 100, 100, image::ImageFormat::Jpeg).unwrap();

        assert!(test_file.exists());

        // Delete the image
        let result = storage.delete_image("1/42.jpg");
        assert!(result.is_ok());
        assert!(!test_file.exists());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_delete_image_non_existing() {
        let temp_dir = std::env::temp_dir().join("vaultrs_test_delete_missing");
        let storage = ImageStorage::new(&temp_dir);

        // Clean up any existing test directory
        let _ = fs::remove_dir_all(&temp_dir);

        // Try to delete a non-existing image
        let result = storage.delete_image("999/999.jpg");
        assert!(result.is_ok()); // Should not error, just log a warning

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_image_exists() {
        let temp_dir = std::env::temp_dir().join("vaultrs_test_exists");
        let storage = ImageStorage::new(&temp_dir);

        // Clean up any existing test directory
        let _ = fs::remove_dir_all(&temp_dir);

        // Create a test image
        let vault_dir = temp_dir.join("images").join("2");
        fs::create_dir_all(&vault_dir).unwrap();
        let test_file = vault_dir.join("10.png");
        create_test_image(&test_file, 50, 50, image::ImageFormat::Png).unwrap();

        assert!(storage.image_exists("2/10.png"));
        assert!(!storage.image_exists("2/99.png"));

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_get_full_path() {
        let temp_dir = std::env::temp_dir();
        let storage = ImageStorage::new(&temp_dir);

        let full_path = storage.get_full_path("3/200.webp");
        assert!(full_path.to_string_lossy().contains("images"));
        assert!(full_path.to_string_lossy().contains("3"));
        assert!(full_path.to_string_lossy().contains("200.webp"));
    }
}
