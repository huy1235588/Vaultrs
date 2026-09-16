//! Managed application state for the active vault.

use std::path::{Path, PathBuf};
use sea_orm::DatabaseConnection;
use tokio::sync::RwLock;

use crate::assets::storage::VaultStorage;
use crate::core::config;
use crate::core::error::AppError;
use crate::db;

/// Dynamic runtime state managing the active vault connection and storage.
#[derive(Default)]
pub struct AppVaultState {
    pub db: RwLock<Option<DatabaseConnection>>,
    pub storage: RwLock<Option<VaultStorage>>,
    pub vault_root: RwLock<Option<PathBuf>>,
}

impl AppVaultState {
    pub fn new() -> Self {
        Self::default()
    }

    /// Retrieve the active database connection or return an error if no vault is loaded.
    pub async fn get_db(&self) -> Result<DatabaseConnection, AppError> {
        self.db
            .read()
            .await
            .clone()
            .ok_or_else(|| AppError::Validation("No active vault is currently loaded. Please select a vault folder.".into()))
    }

    /// Retrieve the active vault storage manager or return an error if no vault is loaded.
    pub async fn get_storage(&self) -> Result<VaultStorage, AppError> {
        self.storage
            .read()
            .await
            .clone()
            .ok_or_else(|| AppError::Validation("No active vault storage is currently loaded. Please select a vault folder.".into()))
    }

    /// Get the current vault root directory path, if configured.
    pub async fn get_vault_root(&self) -> Option<PathBuf> {
        self.vault_root.read().await.clone()
    }

    /// Check whether a vault is currently initialized and ready for queries.
    pub async fn is_loaded(&self) -> bool {
        self.db.read().await.is_some()
    }

    /// Initialize and open a vault in the specified directory.
    ///
    /// This will:
    /// 1. Ensure the directory exists.
    /// 2. Initialize the SQLite database at `{vault_root}/vaultrs.db` with WAL mode and migrations.
    /// 3. Initialize the co-located `VaultStorage` at `{vault_root}/vault-storage`.
    /// 4. Atomically update the active connection and storage state.
    pub async fn init_vault(&self, vault_root: &Path) -> Result<(), AppError> {
        std::fs::create_dir_all(vault_root)?;

        let db_path = config::get_db_path(vault_root);
        let new_db = db::connection::init_database(&db_path).await?;

        let new_storage = VaultStorage::new(vault_root);
        new_storage.ensure_dirs()?;

        // Update managed state
        *self.db.write().await = Some(new_db);
        *self.storage.write().await = Some(new_storage);
        *self.vault_root.write().await = Some(vault_root.to_path_buf());

        log::info!("Vault loaded successfully at: {}", vault_root.display());
        Ok(())
    }

    /// Safely close the active vault.
    pub async fn close_vault(&self) {
        *self.db.write().await = None;
        *self.storage.write().await = None;
        *self.vault_root.write().await = None;
        log::info!("Vault closed");
    }
}
