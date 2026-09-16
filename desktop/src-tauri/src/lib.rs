//! Vaultrs — Library root.
//!
//! Registers all domain modules and sets up the Tauri application.

// Domain modules
pub mod assets;
pub mod collection_settings;
pub mod collections;
pub mod core;
pub mod custom_fields;
pub mod db;
pub mod items;
pub mod relations;
pub mod search;

use std::path::PathBuf;
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

            // Create dynamic AppVaultState
            let vault_state = core::state::AppVaultState::new();

            // Check if machine bootstrap settings have a configured vault_root_path
            let settings = core::config::load_app_settings(app.handle());
            if let Some(ref path_str) = settings.vault_root_path {
                let path = PathBuf::from(path_str);
                if path.exists() {
                    log::info!("Attempting auto-load configured vault at: {}", path.display());
                    if let Err(e) = tauri::async_runtime::block_on(vault_state.init_vault(app.handle(), &path)) {
                        log::warn!("Failed to auto-load vault at {}: {e}", path.display());
                    }
                } else {
                    log::warn!(
                        "Configured vault path '{}' is unreachable. Leaving unloaded for non-destructive recovery.",
                        path.display()
                    );
                }
            } else {
                log::info!("No vault configured yet. Awaiting first-run setup.");
            }

            // Store managed vault state
            app.manage(vault_state);

            log::info!("Vaultrs bootstrap initialized successfully");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Core app settings & vault lifecycle commands
            core::commands::get_app_settings,
            core::commands::set_vault_directory,
            core::commands::validate_vault_directory,
            core::commands::remove_recent_vault,
            core::commands::get_vault_storage_dir,
            core::commands::reveal_vault_in_explorer,
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
            // Relation commands
            relations::commands::resolve_references,
            relations::commands::search_reference_targets,
            relations::commands::get_back_references,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
