//! Application configuration.

use std::path::PathBuf;

/// Returns the path to the application data directory.
///
/// On Windows: `%APPDATA%/com.huy1235588.vaultrs`
/// On macOS: `~/Library/Application Support/com.huy1235588.vaultrs`
/// On Linux: `~/.local/share/com.huy1235588.vaultrs`
pub fn get_app_data_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data directory")
}

/// Returns the path to the SQLite database file.
pub fn get_db_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_data_dir(app).join("vaultrs.db")
}

use tauri::Manager;
