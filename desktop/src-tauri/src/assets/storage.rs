//! Vault Storage — manages media files within the application data directory.
//!
//! All files are stored under `{app_data}/vault-storage/` with relative paths,
//! making the entire vault portable between machines.
//!
//! Directory structure:
//! ```text
//! vault-storage/
//! ├── originals/
//! │   └── {uuid}.{ext}
//! └── thumbnails/
//!     └── {uuid}_thumb.webp
//! ```

use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use uuid::Uuid;

use crate::core::result::AppResult;

/// Root directory name within app data.
const VAULT_STORAGE_DIR: &str = "vault-storage";
const ORIGINALS_DIR: &str = "originals";
const THUMBNAILS_DIR: &str = "thumbnails";

/// Manages file operations for the vault storage.
#[derive(Clone)]
pub struct VaultStorage {
    /// Absolute path to the vault-storage root directory.
    root: PathBuf,
}

impl VaultStorage {
    /// Create a new VaultStorage rooted at the given app data directory.
    pub fn new(app_data_dir: &Path) -> Self {
        Self {
            root: app_data_dir.join(VAULT_STORAGE_DIR),
        }
    }

    /// Ensure all required subdirectories exist.
    pub fn ensure_dirs(&self) -> AppResult<()> {
        std::fs::create_dir_all(self.originals_dir())?;
        std::fs::create_dir_all(self.thumbnails_dir())?;
        Ok(())
    }

    /// Get the absolute path to the originals directory.
    fn originals_dir(&self) -> PathBuf {
        self.root.join(ORIGINALS_DIR)
    }

    /// Get the absolute path to the thumbnails directory.
    fn thumbnails_dir(&self) -> PathBuf {
        self.root.join(THUMBNAILS_DIR)
    }

    /// Copy a file into vault storage and return the relative path.
    ///
    /// The file is stored with a UUID-based name to avoid collisions.
    /// Returns `(relative_path, file_size_bytes, checksum)`.
    pub fn import_file(&self, source: &Path) -> AppResult<ImportResult> {
        self.ensure_dirs()?;

        // Determine extension from source
        let ext = source
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin")
            .to_lowercase();

        // Generate unique filename
        let uuid = Uuid::new_v4();
        let filename = format!("{uuid}.{ext}");
        let relative_path = format!("{ORIGINALS_DIR}/{filename}");
        let dest = self.root.join(&relative_path);

        // Copy file
        std::fs::copy(source, &dest)?;

        // Calculate checksum and file size
        let file_data = std::fs::read(&dest)?;
        let file_size = file_data.len() as i64;
        let checksum = compute_sha256(&file_data);

        Ok(ImportResult {
            relative_path,
            file_size_bytes: file_size,
            checksum,
            absolute_path: dest,
        })
    }

    /// Get the relative path for a new thumbnail file.
    ///
    /// Thumbnails are always stored as WebP for optimal compression.
    pub fn thumbnail_relative_path(&self, original_relative_path: &str) -> String {
        let stem = Path::new(original_relative_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown");

        format!("{THUMBNAILS_DIR}/{stem}_thumb.webp")
    }

    /// Resolve a relative path to an absolute path within the vault.
    pub fn resolve(&self, relative_path: &str) -> PathBuf {
        self.root.join(relative_path)
    }

    /// Delete a file by its relative path. Silently ignores if file doesn't exist.
    pub fn delete_file(&self, relative_path: &str) -> AppResult<()> {
        let path = self.resolve(relative_path);
        if path.exists() {
            std::fs::remove_file(&path)?;
        }
        Ok(())
    }

    /// Get the vault storage root path.
    pub fn root_path(&self) -> &Path {
        &self.root
    }
}

/// Result of importing a file into vault storage.
pub struct ImportResult {
    /// Relative path within vault storage (e.g., "originals/abc123.jpg").
    pub relative_path: String,
    /// Size of the imported file in bytes.
    pub file_size_bytes: i64,
    /// SHA-256 checksum of the file content.
    pub checksum: String,
    /// Absolute path to the imported file (for thumbnail generation).
    pub absolute_path: PathBuf,
}

/// Compute SHA-256 hex digest of data.
fn compute_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// Detect MIME type from file extension.
pub fn mime_from_extension(ext: &str) -> &'static str {
    match ext.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",
        "tiff" | "tif" => "image/tiff",
        _ => "application/octet-stream",
    }
}
