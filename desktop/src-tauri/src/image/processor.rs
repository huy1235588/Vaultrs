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

    #[test]
    fn test_thumbnail_max_size() {
        assert_eq!(THUMBNAIL_MAX_SIZE, 300);
        assert_eq!(THUMBNAIL_JPEG_QUALITY, 85);
    }
}
