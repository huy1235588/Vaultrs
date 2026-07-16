//! Vaultrs — Library root.
//!
//! Registers all domain modules and sets up the Tauri application.

// Domain modules
mod collections;
mod core;
mod custom_fields;
mod db;
mod items;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize database
            let db_path = core::config::get_db_path(app.handle());
            let db = tauri::async_runtime::block_on(async {
                db::connection::init_database(&db_path).await
            })
            .expect("Failed to initialize database");

            // Store database connection as managed state
            app.manage(db);

            log::info!("Vaultrs initialized successfully");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Collection commands
            collections::commands::get_collections,
            collections::commands::get_collection,
            collections::commands::create_collection,
            collections::commands::update_collection,
            collections::commands::delete_collection,
            // Item commands
            items::commands::get_items,
            items::commands::get_item,
            items::commands::create_item,
            items::commands::update_item,
            items::commands::delete_item,
            // Attribute commands
            custom_fields::commands::get_attributes,
            custom_fields::commands::create_attribute,
            custom_fields::commands::update_attribute,
            custom_fields::commands::delete_attribute,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
