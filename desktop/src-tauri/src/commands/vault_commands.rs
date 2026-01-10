//! Vault-related Tauri commands.

use sea_orm::DatabaseConnection;
use tauri::State;

use crate::core::AppError;
use crate::vault::{CreateVaultDto, UpdateVaultDto, VaultDto, VaultService};

/// Creates a new vault.
#[tauri::command]
pub async fn create_vault(
    db: State<'_, DatabaseConnection>,
    name: String,
    description: Option<String>,
    icon: Option<String>,
    color: Option<String>,
) -> Result<VaultDto, AppError> {
    let dto = CreateVaultDto {
        name,
        description,
        icon,
        color,
    };

    VaultService::create(&db, dto).await
}

/// Gets a vault by ID.
#[tauri::command]
pub async fn get_vault(db: State<'_, DatabaseConnection>, id: i32) -> Result<VaultDto, AppError> {
    VaultService::get(&db, id).await
}

/// Lists all vaults.
#[tauri::command]
pub async fn list_vaults(db: State<'_, DatabaseConnection>) -> Result<Vec<VaultDto>, AppError> {
    VaultService::list(&db).await
}

/// Updates an existing vault.
#[tauri::command]
pub async fn update_vault(
    db: State<'_, DatabaseConnection>,
    id: i32,
    name: Option<String>,
    description: Option<String>,
    icon: Option<String>,
    color: Option<String>,
) -> Result<VaultDto, AppError> {
    let dto = UpdateVaultDto {
        name,
        description,
        icon,
        color,
    };

    VaultService::update(&db, id, dto).await
}

/// Deletes a vault.
#[tauri::command]
pub async fn delete_vault(db: State<'_, DatabaseConnection>, id: i32) -> Result<(), AppError> {
    VaultService::delete(&db, id).await
}
