//! Database connection management.

use sea_orm::{Database as SeaDatabase, DatabaseConnection};
use std::path::PathBuf;

use crate::core::AppResult;

/// Database wrapper for managing SQLite connection.
pub struct Database;

impl Database {
    /// Establishes a connection to the SQLite database.
    /// Creates the database file and parent directories if they don't exist.
    pub async fn connect(app_data_dir: &PathBuf) -> AppResult<DatabaseConnection> {
        // Ensure the directory exists
        std::fs::create_dir_all(app_data_dir).map_err(|e| {
            crate::core::AppError::Internal(format!("Failed to create data directory: {}", e))
        })?;

        let db_path = app_data_dir.join("vaultrs.db");
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

        log::info!("Connecting to database: {}", db_path.display());

        let conn = SeaDatabase::connect(&db_url).await?;

        // Enable WAL mode for better concurrent access
        sea_orm::ConnectionTrait::execute_unprepared(&conn, "PRAGMA journal_mode=WAL;").await?;
        sea_orm::ConnectionTrait::execute_unprepared(&conn, "PRAGMA foreign_keys=ON;").await?;

        log::info!("Database connection established with WAL mode");

        Ok(conn)
    }
}
