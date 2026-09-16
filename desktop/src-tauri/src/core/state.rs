//! Managed application state for the active vault.

use std::path::{Path, PathBuf};
use sea_orm::{ConnectionTrait, DatabaseConnection};
use tauri::Manager;
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

    /// Initialize and open a vault in the specified directory using a Tauri AppHandle for asset scoping.
    pub async fn init_vault(&self, app: &tauri::AppHandle, vault_root: &Path) -> Result<(), AppError> {
        // Register dynamic asset protocol scope so convertFileSrc can load media
        app.asset_protocol_scope()
            .allow_directory(vault_root, true)
            .map_err(|e| AppError::Internal(format!("Failed to register asset protocol scope: {e}")))?;

        self.init_vault_internal(vault_root).await
    }

    /// Initialize a vault headlessly (useful for tests or tasks without a running Tauri AppHandle).
    pub async fn init_vault_headless(&self, vault_root: &Path) -> Result<(), AppError> {
        self.init_vault_internal(vault_root).await
    }

    /// Shared internal initialization logic: tear down active vault, initialize DB, storage, and state.
    async fn init_vault_internal(&self, vault_root: &Path) -> Result<(), AppError> {
        // 1. Cleanly close any existing active connection & release file handles
        self.close_vault().await?;

        // 2. Ensure target directory exists
        std::fs::create_dir_all(vault_root)?;

        // 3. Initialize database connection and run pending migrations
        let db_path = config::get_db_path(vault_root);
        let new_db = db::connection::init_database(&db_path).await?;

        // 4. Initialize co-located assets storage
        let new_storage = VaultStorage::new(vault_root);
        new_storage.ensure_dirs()?;

        // 5. Update managed state
        *self.db.write().await = Some(new_db);
        *self.storage.write().await = Some(new_storage);
        *self.vault_root.write().await = Some(vault_root.to_path_buf());

        log::info!("Vault loaded successfully at: {}", vault_root.display());
        Ok(())
    }

    /// Safely close the active vault, releasing SQLite file locks and truncating WAL.
    pub async fn close_vault(&self) -> Result<(), AppError> {
        let mut db_lock = self.db.write().await;
        if let Some(old_db) = db_lock.take() {
            // 1. Truncate WAL to ensure everything is flushed to disk
            let _ = old_db.execute_unprepared("PRAGMA wal_checkpoint(TRUNCATE);").await;
            // 2. Explicitly drain and close connection pool
            let _ = old_db.close().await;
            // 3. Allow Tokio and OS I/O subsystems to finish closing handles (especially on Windows)
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }
        *self.storage.write().await = None;
        *self.vault_root.write().await = None;
        log::info!("Vault closed and SQLite locks released");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_vault_lifecycle_connection_teardown() {
        let temp_dir = std::env::temp_dir().join(format!("vaultrs_test_{}", uuid::Uuid::new_v4()));
        let state = AppVaultState::new();

        assert!(!state.is_loaded().await);

        // 1. Open vault
        state.init_vault_headless(&temp_dir).await.expect("Failed to init vault");
        assert!(state.is_loaded().await);
        assert_eq!(state.get_vault_root().await, Some(temp_dir.clone()));

        {
            let db = state.get_db().await.expect("DB should be available");
            // Execute dummy query to ensure pool is active
            db.execute_unprepared("SELECT 1;").await.expect("Query failed");
        }

        let db_path = config::get_db_path(&temp_dir);
        assert!(db_path.exists());

        // 2. Close vault
        state.close_vault().await.expect("Failed to close vault");
        assert!(!state.is_loaded().await);
        assert!(state.get_vault_root().await.is_none());

        // 3. Verify SQLite file locks are completely released on Windows by renaming or deleting the db file
        let renamed_path = temp_dir.join("vaultrs_renamed.db");
        std::fs::rename(&db_path, &renamed_path).expect("File must be unlocked and renameable on Windows!");
        assert!(renamed_path.exists());

        // Cleanup
        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[tokio::test]
    async fn test_vault_runtime_switching() {
        let temp_dir_a = std::env::temp_dir().join(format!("vaultrs_switch_a_{}", uuid::Uuid::new_v4()));
        let temp_dir_b = std::env::temp_dir().join(format!("vaultrs_switch_b_{}", uuid::Uuid::new_v4()));
        let state = AppVaultState::new();

        // Open Vault A
        state.init_vault_headless(&temp_dir_a).await.expect("Failed to init A");
        assert_eq!(state.get_vault_root().await, Some(temp_dir_a.clone()));

        // Switch to Vault B (automatically closes Vault A)
        state.init_vault_headless(&temp_dir_b).await.expect("Failed to switch to B");
        assert_eq!(state.get_vault_root().await, Some(temp_dir_b.clone()));

        // Vault A should now be completely unlocked
        let db_path_a = config::get_db_path(&temp_dir_a);
        let renamed_a = temp_dir_a.join("vault_a_renamed.db");
        std::fs::rename(&db_path_a, &renamed_a).expect("Vault A should be unlocked after switching to B");

        // Close state
        state.close_vault().await.expect("Failed to close");

        // Cleanup
        let _ = std::fs::remove_dir_all(&temp_dir_a);
        let _ = std::fs::remove_dir_all(&temp_dir_b);
    }
}
