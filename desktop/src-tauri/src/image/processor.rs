//! Image processing for thumbnail generation.

use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView};
use std::io::Cursor;
use std::path::Path;

use crate::core::{AppError, AppResult};

/// Maximum thumbnail dimensions (maintains aspect ratio).
const THUMBNAIL_MAX_SIZE: u32 = 300;

/// JPEG quality for thumbnails (0-100).
const THUMBNAIL_JPEG_QUALITY: u8 = 85;

/// Image processor for thumbnail generation and format conversion.
pub struct ImageProcessor;

impl ImageProcessor {
    /// Generates a thumbnail from an image file.
    /// Returns JPEG bytes with max dimensions of 300x300 (maintains aspect ratio).
    pub fn generate_thumbnail(source_path: &Path) -> AppResult<Vec<u8>> {
        log::debug!("Generating thumbnail for: {}", source_path.display());

        // Load the image
        let img = image::open(source_path).map_err(|e| {
            AppError::Internal(format!("Failed to open image for thumbnail generation: {}", e))
        })?;

        // Generate thumbnail
        let thumbnail = Self::resize_image(img, THUMBNAIL_MAX_SIZE)?;

        // Encode as JPEG
        let jpeg_bytes = Self::encode_jpeg(thumbnail, THUMBNAIL_JPEG_QUALITY)?;

        log::debug!(
            "Thumbnail generated: {} bytes",
            jpeg_bytes.len()
        );

        Ok(jpeg_bytes)
    }

    /// Resizes an image to fit within the given max dimension while maintaining aspect ratio.
    fn resize_image(img: DynamicImage, max_size: u32) -> AppResult<DynamicImage> {
        let (width, height) = img.dimensions();

        // Calculate new dimensions maintaining aspect ratio
        let (new_width, new_height) = if width > height {
            let ratio = max_size as f32 / width as f32;
            (max_size, (height as f32 * ratio) as u32)
        } else {
            let ratio = max_size as f32 / height as f32;
            ((width as f32 * ratio) as u32, max_size)
        };

        // Only resize if the image is larger than max_size
        if width <= max_size && height <= max_size {
            return Ok(img);
        }

        log::debug!(
            "Resizing image from {}x{} to {}x{}",
            width,
            height,
            new_width,
            new_height
        );

        // Use Lanczos3 filter for high-quality resizing
        Ok(img.resize(new_width, new_height, FilterType::Lanczos3))
    }

    /// Encodes an image as JPEG with the specified quality.
    fn encode_jpeg(img: DynamicImage, quality: u8) -> AppResult<Vec<u8>> {
        let mut buffer = Cursor::new(Vec::new());

        let rgb_img = img.to_rgb8();

        image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, quality)
            .encode(
                rgb_img.as_raw(),
                rgb_img.width(),
                rgb_img.height(),
                image::ExtendedColorType::Rgb8,
            )
            .map_err(|e| AppError::Internal(format!("Failed to encode thumbnail as JPEG: {}", e)))?;

        Ok(buffer.into_inner())
    }

    /// Converts thumbnail bytes to base64 for frontend display.
    pub fn to_base64(bytes: &[u8]) -> String {
        use base64::{engine::general_purpose, Engine as _};
        general_purpose::STANDARD.encode(bytes)
    }

    /// Gets the data URL for a thumbnail (can be used in img src).
    pub fn to_data_url(bytes: &[u8]) -> String {
        format!("data:image/jpeg;base64,{}", Self::to_base64(bytes))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    /// Helper function to create a temporary test image file.
    fn create_test_image(path: &Path, width: u32, height: u32) -> std::io::Result<()> {
        let img = DynamicImage::new_rgb8(width, height);
        img.save(path).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
    }

    #[test]
    fn test_thumbnail_max_size() {
        assert_eq!(THUMBNAIL_MAX_SIZE, 300);
        assert_eq!(THUMBNAIL_JPEG_QUALITY, 85);
    }

    #[test]
    fn test_resize_image_landscape() {
        // Create a landscape image (wider than tall)
        let img = DynamicImage::new_rgb8(800, 600);

        let resized = ImageProcessor::resize_image(img, THUMBNAIL_MAX_SIZE).unwrap();
        let (width, height) = resized.dimensions();

        assert_eq!(width, 300);
        assert_eq!(height, 225); // Maintains aspect ratio (800:600 = 300:225)
    }

    #[test]
    fn test_resize_image_portrait() {
        // Create a portrait image (taller than wide)
        let img = DynamicImage::new_rgb8(600, 800);

        let resized = ImageProcessor::resize_image(img, THUMBNAIL_MAX_SIZE).unwrap();
        let (width, height) = resized.dimensions();

        assert_eq!(width, 225); // Maintains aspect ratio (600:800 = 225:300)
        assert_eq!(height, 300);
    }

    #[test]
    fn test_resize_image_square() {
        // Create a square image
        let img = DynamicImage::new_rgb8(1000, 1000);

        let resized = ImageProcessor::resize_image(img, THUMBNAIL_MAX_SIZE).unwrap();
        let (width, height) = resized.dimensions();

        assert_eq!(width, 300);
        assert_eq!(height, 300);
    }

    #[test]
    fn test_resize_image_no_upscaling() {
        // Create an image smaller than max size
        let img = DynamicImage::new_rgb8(200, 150);

        let resized = ImageProcessor::resize_image(img, THUMBNAIL_MAX_SIZE).unwrap();
        let (width, height) = resized.dimensions();

        // Should not upscale
        assert_eq!(width, 200);
        assert_eq!(height, 150);
    }

    #[test]
    fn test_encode_jpeg_quality() {
        let img = DynamicImage::new_rgb8(100, 100);

        // Test with different quality levels
        let high_quality = ImageProcessor::encode_jpeg(img.clone(), 95).unwrap();
        let low_quality = ImageProcessor::encode_jpeg(img.clone(), 50).unwrap();

        // Higher quality should result in larger file size
        assert!(high_quality.len() > low_quality.len());
    }

    #[test]
    fn test_encode_jpeg_valid_output() {
        let img = DynamicImage::new_rgb8(100, 100);

        let jpeg_bytes = ImageProcessor::encode_jpeg(img, 85).unwrap();

        // JPEG files start with FF D8 (SOI marker)
        assert_eq!(jpeg_bytes[0], 0xFF);
        assert_eq!(jpeg_bytes[1], 0xD8);

        // JPEG files should not be empty
        assert!(!jpeg_bytes.is_empty());
    }

    #[test]
    fn test_to_base64_encoding() {
        let test_data = b"Hello, World!";
        let base64 = ImageProcessor::to_base64(test_data);

        // Verify base64 encoding
        assert_eq!(base64, "SGVsbG8sIFdvcmxkIQ==");
    }

    #[test]
    fn test_to_data_url_format() {
        let test_data = b"test";
        let data_url = ImageProcessor::to_data_url(test_data);

        // Should start with the data URL prefix
        assert!(data_url.starts_with("data:image/jpeg;base64,"));

        // Should contain base64-encoded data
        assert!(data_url.len() > "data:image/jpeg;base64,".len());
    }

    #[test]
    fn test_generate_thumbnail_integration() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_thumbnail_gen.jpg");

        // Create a large test image
        create_test_image(&test_file, 1920, 1080).unwrap();

        // Generate thumbnail
        let thumbnail_bytes = ImageProcessor::generate_thumbnail(&test_file).unwrap();

        // Verify thumbnail is valid JPEG
        assert_eq!(thumbnail_bytes[0], 0xFF);
        assert_eq!(thumbnail_bytes[1], 0xD8);

        // Verify thumbnail is smaller than original
        let original_size = fs::metadata(&test_file).unwrap().len();
        assert!((thumbnail_bytes.len() as u64) < original_size);

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_generate_thumbnail_various_formats() {
        let temp_dir = std::env::temp_dir();

        // Test PNG
        let png_file = temp_dir.join("test_thumb_png.png");
        create_test_image(&png_file, 500, 500).unwrap();
        let png_result = ImageProcessor::generate_thumbnail(&png_file);
        assert!(png_result.is_ok());
        let _ = fs::remove_file(png_file);

        // Test JPEG
        let jpg_file = temp_dir.join("test_thumb_jpg.jpg");
        create_test_image(&jpg_file, 500, 500).unwrap();
        let jpg_result = ImageProcessor::generate_thumbnail(&jpg_file);
        assert!(jpg_result.is_ok());
        let _ = fs::remove_file(jpg_file);
    }

    #[test]
    fn test_generate_thumbnail_invalid_file() {
        let temp_dir = std::env::temp_dir();
        let invalid_file = temp_dir.join("test_invalid_thumbnail.txt");

        fs::write(&invalid_file, b"not an image").unwrap();

        let result = ImageProcessor::generate_thumbnail(&invalid_file);
        assert!(result.is_err());

        // Clean up
        let _ = fs::remove_file(invalid_file);
    }

    #[test]
    fn test_generate_thumbnail_nonexistent_file() {
        let temp_dir = std::env::temp_dir();
        let nonexistent = temp_dir.join("does_not_exist.jpg");

        let result = ImageProcessor::generate_thumbnail(&nonexistent);
        assert!(result.is_err());
    }
}
