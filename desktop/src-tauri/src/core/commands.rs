//! Tauri commands for application configuration and vault lifecycle.

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::core::config::{self, VaultDirectoryStatus};
use crate::core::error::AppError;
use crate::core::state::AppVaultState;

/// DTO for frontend consumption of recent vault entries.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentVaultDto {
    pub path: String,
    pub display_name: String,
    pub last_opened: u64,
    pub is_reachable: bool,
}

/// DTO for frontend consumption of application settings.
#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettingsDto {
    pub vault_root_path: Option<String>,
    pub is_vault_loaded: bool,
    pub db_path: Option<String>,
    pub storage_dir: Option<String>,
    pub recent_vaults: Vec<RecentVaultDto>,
    pub unreachable_vault_path: Option<String>,
}

fn build_recent_dtos(settings: &config::AppSettings) -> Vec<RecentVaultDto> {
    settings
        .recent_vaults
        .iter()
        .map(|r| RecentVaultDto {
            path: r.path.clone(),
            display_name: r.display_name.clone(),
            last_opened: r.last_opened,
            is_reachable: Path::new(&r.path).exists(),
        })
        .collect()
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

    let unreachable_vault_path = if !is_loaded {
        if let Some(ref configured_path) = settings.vault_root_path {
            if !Path::new(configured_path).exists() {
                Some(configured_path.clone())
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    let recent_dtos = build_recent_dtos(&settings);

    Ok(AppSettingsDto {
        vault_root_path: settings.vault_root_path,
        is_vault_loaded: is_loaded,
        db_path,
        storage_dir,
        recent_vaults: recent_dtos,
        unreachable_vault_path,
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

    // Initialize or open the vault in this directory (with clean teardown and dynamic asset scoping)
    vault.init_vault(&app, &vault_root).await?;

    // Record into MRU and persist machine settings
    let mut settings = config::load_app_settings(&app);
    settings.record_vault_opened(&vault_root);
    config::save_app_settings(&app, &settings)?;

    let canonical_str = vault_root.to_string_lossy().to_string();
    let db_path = config::get_db_path(&vault_root).to_string_lossy().to_string();
    let storage_dir = config::get_vault_storage_dir(&vault_root).to_string_lossy().to_string();

    Ok(AppSettingsDto {
        vault_root_path: Some(canonical_str),
        is_vault_loaded: true,
        db_path: Some(db_path),
        storage_dir: Some(storage_dir),
        recent_vaults: build_recent_dtos(&settings),
        unreachable_vault_path: None,
    })
}

/// Validate a folder before attempting to open or initialize as a vault.
#[tauri::command]
pub async fn validate_vault_directory(path: String) -> Result<VaultDirectoryStatus, AppError> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Path cannot be empty".into()));
    }
    Ok(config::validate_vault_directory(Path::new(trimmed)))
}

/// Remove a vault from the recent vaults history.
#[tauri::command]
pub async fn remove_recent_vault(
    app: AppHandle,
    vault: State<'_, AppVaultState>,
    path: String,
) -> Result<AppSettingsDto, AppError> {
    let mut settings = config::load_app_settings(&app);
    settings.remove_recent_vault(&path);
    config::save_app_settings(&app, &settings)?;

    get_app_settings(app, vault).await
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
