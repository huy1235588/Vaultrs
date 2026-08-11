//! Vaultrs — Library root.
//!
//! Registers all domain modules and sets up the Tauri application.

// Domain modules
mod assets;
mod collection_settings;
mod collections;
mod core;
mod custom_fields;
mod db;
mod items;
mod search;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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

            // Initialize vault storage
            let app_data_dir = core::config::get_app_data_dir(app.handle());
            let vault_storage = assets::storage::VaultStorage::new(&app_data_dir);
            vault_storage
                .ensure_dirs()
                .expect("Failed to create vault storage directories");
            app.manage(vault_storage);

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
            items::commands::get_items_cursor,
            items::commands::get_item,
            items::commands::create_item,
            items::commands::update_item,
            items::commands::delete_item,
            // Attribute commands
            custom_fields::commands::get_attributes,
            custom_fields::commands::create_attribute,
            custom_fields::commands::update_attribute,
            custom_fields::commands::delete_attribute,
            // Search commands
            search::commands::search_items,
            search::commands::quick_search,
            // Collection settings commands
            collection_settings::commands::get_collection_settings,
            collection_settings::commands::update_collection_settings,
            // Asset commands
            assets::commands::upload_asset,
            assets::commands::add_remote_asset,
            assets::commands::get_item_assets,
            assets::commands::get_item_cover,
            assets::commands::get_covers_batch,
            assets::commands::set_item_cover,
            assets::commands::delete_asset,
            assets::commands::unlink_asset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
