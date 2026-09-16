//! Application configuration and bootstrap settings.

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::core::error::AppError;

pub const SETTINGS_FILE_NAME: &str = "vaultrs-settings.json";
pub const DB_FILE_NAME: &str = "vaultrs.db";
pub const STORAGE_DIR_NAME: &str = "vault-storage";
pub const MAX_RECENT_VAULTS: usize = 5;

/// An entry in the Most-Recently-Used (MRU) vaults history.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RecentVaultEntry {
    /// Canonical absolute path to the vault root directory.
    pub path: String,
    /// User-friendly display label (defaults to folder basename).
    pub display_name: String,
    /// Unix timestamp in milliseconds when this vault was last opened.
    pub last_opened: u64,
}

/// Machine-level application settings persisted in standard OS config directory.
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
pub struct AppSettings {
    /// User-configured root directory for the active vault.
    pub vault_root_path: Option<String>,
    /// Most-recently-used vault history, capped at MAX_RECENT_VAULTS items, sorted newest-first.
    #[serde(default)]
    pub recent_vaults: Vec<RecentVaultEntry>,
}

impl AppSettings {
    /// Record opening a vault path into the MRU list.
    ///
    /// Deduplicates by path, moves to front (index 0), updates the timestamp,
    /// caps the list to `MAX_RECENT_VAULTS`, and sets `self.vault_root_path`.
    pub fn record_vault_opened(&mut self, vault_path: &Path) {
        let canonical_str = vault_path.to_string_lossy().to_string();
        let display_name = vault_path
            .file_name()
            .and_then(|n| n.to_str())
            .filter(|s| !s.is_empty())
            .unwrap_or(&canonical_str)
            .to_string();

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        // Remove existing entry with same path if present
        self.recent_vaults.retain(|v| v.path != canonical_str);

        // Prepend to MRU list
        self.recent_vaults.insert(
            0,
            RecentVaultEntry {
                path: canonical_str.clone(),
                display_name,
                last_opened: now,
            },
        );

        // Cap at maximum recent items
        self.recent_vaults.truncate(MAX_RECENT_VAULTS);

        // Update active vault root
        self.vault_root_path = Some(canonical_str);
    }

    /// Remove a vault from the recent history list.
    pub fn remove_recent_vault(&mut self, path: &str) {
        self.recent_vaults.retain(|v| v.path != path);
    }

    /// Prune any recent vaults whose folders no longer exist on disk.
    pub fn prune_missing_vaults(&mut self) {
        self.recent_vaults.retain(|v| Path::new(&v.path).exists());
    }
}

/// Status of a directory inspected for vault initialization or attachment.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum VaultDirectoryStatus {
    /// Valid directory containing an existing, valid vaultrs.db
    ValidExistingVault,
    /// Empty directory, ready for fresh vault initialization
    EmptyDirectory,
    /// Directory contains non-conflicting files but lacks vaultrs.db (requires confirmation)
    NonEmptyWithoutDb,
    /// OS write permission denied
    PermissionDenied(String),
    /// Path does not exist
    NotFound(String),
    /// SQLite file exists but failed connection check or header validation
    CorruptedDb(String),
}

/// Inspect a directory path and validate its fitness as a Vault root.
pub fn validate_vault_directory(path: &Path) -> VaultDirectoryStatus {
    if !path.exists() {
        return VaultDirectoryStatus::NotFound(format!("Path does not exist: {}", path.display()));
    }

    if !path.is_dir() {
        return VaultDirectoryStatus::PermissionDenied(format!("Path is not a directory: {}", path.display()));
    }

    // Probe write permission by attempting to write and delete a probe file
    let probe_file = path.join(".vaultrs_write_probe");
    match std::fs::write(&probe_file, b"vaultrs_probe") {
        Ok(_) => {
            let _ = std::fs::remove_file(&probe_file);
        }
        Err(e) => {
            return VaultDirectoryStatus::PermissionDenied(format!("Directory is not writable: {e}"));
        }
    }

    let db_path = get_db_path(path);
    if db_path.exists() {
        // Inspect SQLite header (first 16 bytes must match "SQLite format 3\0")
        match std::fs::read(&db_path) {
            Ok(bytes) => {
                if bytes.len() >= 16 && &bytes[0..16] == b"SQLite format 3\0" {
                    VaultDirectoryStatus::ValidExistingVault
                } else if bytes.is_empty() {
                    VaultDirectoryStatus::CorruptedDb("Database file exists but is empty (0 bytes)".into())
                } else {
                    VaultDirectoryStatus::CorruptedDb("File is not a valid SQLite database header".into())
                }
            }
            Err(e) => VaultDirectoryStatus::PermissionDenied(format!("Could not read database file: {e}")),
        }
    } else {
        // Read directory entries
        match std::fs::read_dir(path) {
            Ok(entries) => {
                let visible_count = entries
                    .filter_map(|e| e.ok())
                    .filter(|e| {
                        let name = e.file_name();
                        let s = name.to_string_lossy();
                        !s.starts_with('.') // ignore hidden files/directories like .git or .obsidian
                    })
                    .count();

                if visible_count == 0 {
                    VaultDirectoryStatus::EmptyDirectory
                } else {
                    VaultDirectoryStatus::NonEmptyWithoutDb
                }
            }
            Err(e) => VaultDirectoryStatus::PermissionDenied(format!("Failed to read directory: {e}")),
        }
    }
}

/// Path to the machine-level settings file in standard app config directory.
pub fn get_settings_file_path(app: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::Internal(format!("Failed to determine app config directory: {e}")))?;
    Ok(config_dir.join(SETTINGS_FILE_NAME))
}

/// Load machine-level settings from disk, returning default if file does not exist.
pub fn load_app_settings(app: &tauri::AppHandle) -> AppSettings {
    match get_settings_file_path(app) {
        Ok(path) => {
            if path.exists() {
                match std::fs::read_to_string(&path) {
                    Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
                    Err(err) => {
                        log::warn!("Could not read settings file: {err}");
                        AppSettings::default()
                    }
                }
            } else {
                AppSettings::default()
            }
        }
        Err(err) => {
            log::warn!("Could not resolve settings file path: {err}");
            AppSettings::default()
        }
    }
}

/// Save machine-level settings to disk.
pub fn save_app_settings(app: &tauri::AppHandle, settings: &AppSettings) -> Result<(), AppError> {
    let path = get_settings_file_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(settings)?;
    std::fs::write(&path, json)?;
    Ok(())
}

/// Get the path to `vaultrs.db` strictly co-located inside the given vault root directory.
pub fn get_db_path(vault_root: &Path) -> PathBuf {
    vault_root.join(DB_FILE_NAME)
}

/// Get the path to the `vault-storage` assets directory strictly co-located inside the given vault root directory.
pub fn get_vault_storage_dir(vault_root: &Path) -> PathBuf {
    vault_root.join(STORAGE_DIR_NAME)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mru_record_opened_and_capped() {
        let mut settings = AppSettings::default();
        assert!(settings.recent_vaults.is_empty());
        assert!(settings.vault_root_path.is_none());

        for i in 1..=7 {
            let path = PathBuf::from(format!("D:/Vault_{i}"));
            settings.record_vault_opened(&path);
            assert_eq!(settings.vault_root_path.as_deref(), Some(format!("D:/Vault_{i}").as_str()));
        }

        // Capped at MAX_RECENT_VAULTS (5)
        assert_eq!(settings.recent_vaults.len(), 5);
        // Most recent is at head
        assert_eq!(settings.recent_vaults[0].path, "D:/Vault_7");
        assert_eq!(settings.recent_vaults[0].display_name, "Vault_7");
        assert_eq!(settings.recent_vaults[4].path, "D:/Vault_3");
    }

    #[test]
    fn test_mru_deduplication_moves_to_front() {
        let mut settings = AppSettings::default();
        let path1 = PathBuf::from("D:/Vault_A");
        let path2 = PathBuf::from("D:/Vault_B");

        settings.record_vault_opened(&path1);
        settings.record_vault_opened(&path2);
        assert_eq!(settings.recent_vaults.len(), 2);
        assert_eq!(settings.recent_vaults[0].path, "D:/Vault_B");

        // Re-open path1
        settings.record_vault_opened(&path1);
        assert_eq!(settings.recent_vaults.len(), 2);
        assert_eq!(settings.recent_vaults[0].path, "D:/Vault_A");
        assert_eq!(settings.recent_vaults[1].path, "D:/Vault_B");
    }

    #[test]
    fn test_mru_remove_and_prune() {
        let mut settings = AppSettings::default();
        settings.record_vault_opened(Path::new("D:/Vault_A"));
        settings.record_vault_opened(Path::new("D:/Vault_B"));

        settings.remove_recent_vault("D:/Vault_A");
        assert_eq!(settings.recent_vaults.len(), 1);
        assert_eq!(settings.recent_vaults[0].path, "D:/Vault_B");
    }

    #[test]
    fn test_validate_directory_not_found() {
        let nonexistent = Path::new("Z:/definitely_does_not_exist_987654");
        match validate_vault_directory(nonexistent) {
            VaultDirectoryStatus::NotFound(_) => (),
            other => panic!("Expected NotFound, got {:?}", other),
        }
    }

    #[test]
    fn test_validate_empty_and_valid_db() {
        let temp_dir = std::env::temp_dir().join("vaultrs_test_validate");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).unwrap();

        // 1. Empty directory
        assert_eq!(validate_vault_directory(&temp_dir), VaultDirectoryStatus::EmptyDirectory);

        // 2. Non-empty without DB
        let dummy_file = temp_dir.join("notes.txt");
        std::fs::write(&dummy_file, b"hello").unwrap();
        assert_eq!(validate_vault_directory(&temp_dir), VaultDirectoryStatus::NonEmptyWithoutDb);

        // 3. Corrupted DB
        let db_file = temp_dir.join(DB_FILE_NAME);
        std::fs::write(&db_file, b"not a sqlite header").unwrap();
        match validate_vault_directory(&temp_dir) {
            VaultDirectoryStatus::CorruptedDb(_) => (),
            other => panic!("Expected CorruptedDb, got {:?}", other),
        }

        // 4. Valid SQLite header
        let mut valid_header = b"SQLite format 3\0".to_vec();
        valid_header.resize(100, 0);
        std::fs::write(&db_file, &valid_header).unwrap();
        assert_eq!(validate_vault_directory(&temp_dir), VaultDirectoryStatus::ValidExistingVault);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
