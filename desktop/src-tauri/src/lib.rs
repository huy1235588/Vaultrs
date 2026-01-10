//! Vaultrs - Desktop application for managing large-scale personal collections.

mod commands;
mod core;
mod db;
mod entities;
mod entry;
mod field;
mod vault;

use sea_orm::DatabaseConnection;
use std::path::PathBuf;
use tauri::Manager;

use crate::commands::{
    count_entries, create_entry, create_field_definition, create_vault, delete_entry,
    delete_field_definition, delete_vault, get_entry, get_field_definition, get_vault,
    list_entries, list_field_definitions, list_vaults, reorder_field_definitions, update_entry,
    update_field_definition, update_vault,
};
use crate::db::{run_migrations, Database};

/// Application state containing database connection.
pub struct AppState {
    pub db: DatabaseConnection,
}

/// Initializes the database and returns the connection.
async fn init_database(
    app_data_dir: PathBuf,
) -> Result<DatabaseConnection, Box<dyn std::error::Error>> {
    let conn = Database::connect(&app_data_dir).await?;
    run_migrations(&conn).await?;
    Ok(conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            log::info!("App data directory: {}", app_data_dir.display());

            // Initialize database synchronously using tokio runtime
            let conn = tauri::async_runtime::block_on(async {
                init_database(app_data_dir)
                    .await
                    .expect("Failed to initialize database")
            });

            app.manage(conn);

            log::info!("Vaultrs initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Vault commands
            create_vault,
            get_vault,
            list_vaults,
            update_vault,
            delete_vault,
            // Entry commands
            create_entry,
            get_entry,
            list_entries,
            count_entries,
            update_entry,
            delete_entry,
            // Field Definition commands
            create_field_definition,
            get_field_definition,
            list_field_definitions,
            update_field_definition,
            delete_field_definition,
            reorder_field_definitions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
