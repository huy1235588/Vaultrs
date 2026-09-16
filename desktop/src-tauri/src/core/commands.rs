//! Tauri commands for application configuration and vault lifecycle.

use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::core::config::{self, AppSettings};
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// DTO for frontend consumption of application settings.
#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettingsDto {
    pub vault_root_path: Option<String>,
    pub is_vault_loaded: bool,
    pub db_path: Option<String>,
    pub storage_dir: Option<String>,
}

/// Retrieve current application settings and vault status.
#[tauri::command]
pub async fn get_app_settings(
    app: AppHandle,
    vault: State<'_, AppVaultState>,
) -> Result<AppSettingsDto, AppError> {
    let settings = config::load_app_settings(&app);
    let is_loaded = vault.is_loaded().await;
    let vault_root = vault.get_vault_root().await;

    let db_path = vault_root.as_ref().map(|r| config::get_db_path(r).to_string_lossy().to_string());
    let storage_dir = vault_root.as_ref().map(|r| config::get_vault_storage_dir(r).to_string_lossy().to_string());

    Ok(AppSettingsDto {
        vault_root_path: settings.vault_root_path,
        is_vault_loaded: is_loaded,
        db_path,
        storage_dir,
    })
}

/// Configure and switch the active vault directory.
#[tauri::command]
pub async fn set_vault_directory(
    app: AppHandle,
    vault: State<'_, AppVaultState>,
    path: String,
) -> Result<AppSettingsDto, AppError> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Vault path cannot be empty".into()));
    }

    let vault_root = PathBuf::from(trimmed);

    // Initialize or open the vault in this directory
    vault.init_vault(&vault_root).await?;

    // Persist machine settings
    let canonical_str = vault_root.to_string_lossy().to_string();
    let new_settings = AppSettings {
        vault_root_path: Some(canonical_str.clone()),
    };
    config::save_app_settings(&app, &new_settings)?;

    let db_path = config::get_db_path(&vault_root).to_string_lossy().to_string();
    let storage_dir = config::get_vault_storage_dir(&vault_root).to_string_lossy().to_string();

    Ok(AppSettingsDto {
        vault_root_path: Some(canonical_str),
        is_vault_loaded: true,
        db_path: Some(db_path),
        storage_dir: Some(storage_dir),
    })
}

/// Get the absolute path to the active vault storage directory.
#[tauri::command]
pub async fn get_vault_storage_dir(
    vault: State<'_, AppVaultState>,
) -> Result<String, AppError> {
    let storage = vault.get_storage().await?;
    Ok(storage.root_path().to_string_lossy().to_string())
}

/// Reveal the current active vault directory in the OS file manager (Windows Explorer, Finder, etc.).
#[tauri::command]
pub async fn reveal_vault_in_explorer(
    vault: State<'_, AppVaultState>,
) -> Result<(), AppError> {
    let vault_root = vault
        .get_vault_root()
        .await
        .ok_or_else(|| AppError::Validation("No active vault path configured".into()))?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&vault_root)
            .spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&vault_root)
            .spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&vault_root)
            .spawn()?;
    }

    Ok(())
}
