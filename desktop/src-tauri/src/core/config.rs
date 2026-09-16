//! Application configuration and bootstrap settings.

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::core::error::AppError;

const SETTINGS_FILE_NAME: &str = "vaultrs-settings.json";
const DB_FILE_NAME: &str = "vaultrs.db";
const STORAGE_DIR_NAME: &str = "vault-storage";

/// Machine-level application settings persisted in standard OS config directory.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    /// User-configured root directory for the active vault.
    pub vault_root_path: Option<String>,
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
