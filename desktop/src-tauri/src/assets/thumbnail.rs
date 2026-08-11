//! Thumbnail generation using the `image` crate.
//!
//! Generates WebP thumbnails at a fixed max size for efficient
//! rendering in Grid/List views.

use std::path::Path;

use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Maximum thumbnail dimensions (width × height).
const THUMB_MAX_WIDTH: u32 = 300;
const THUMB_MAX_HEIGHT: u32 = 450;

/// Result of thumbnail generation.
pub struct ThumbnailResult {
    /// Width of the generated thumbnail.
    pub width: u32,
    /// Height of the generated thumbnail.
    pub height: u32,
    /// Width of the original image.
    pub original_width: u32,
    /// Height of the original image.
    pub original_height: u32,
}

/// Generate a thumbnail from the source image and save to the destination path.
///
/// The thumbnail preserves aspect ratio and fits within
/// `THUMB_MAX_WIDTH × THUMB_MAX_HEIGHT`. Output format is WebP.
///
/// Returns dimensions of both the original and the generated thumbnail.
pub fn generate_thumbnail(source: &Path, dest: &Path) -> AppResult<ThumbnailResult> {
    // Ensure parent directory exists
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Open and decode the source image
    let img = image::open(source).map_err(|e| {
        AppError::Internal(format!("Failed to open image for thumbnail: {e}"))
    })?;

    let original_width = img.width();
    let original_height = img.height();

    // Resize using Lanczos3 filter for high quality
    let thumbnail = img.resize(
        THUMB_MAX_WIDTH,
        THUMB_MAX_HEIGHT,
        image::imageops::FilterType::Lanczos3,
    );

    let thumb_width = thumbnail.width();
    let thumb_height = thumbnail.height();

    // Save as WebP
    thumbnail.save(dest).map_err(|e| {
        AppError::Internal(format!("Failed to save thumbnail: {e}"))
    })?;

    Ok(ThumbnailResult {
        width: thumb_width,
        height: thumb_height,
        original_width,
        original_height,
    })
}

/// Check if a file extension is a supported image format for thumbnail generation.
pub fn is_supported_image(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif" | "tiff" | "tif"
    )
}
