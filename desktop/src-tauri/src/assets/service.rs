//! Asset business logic — CRUD, file import, cover management.

use sea_orm::*;
use std::collections::HashMap;
use std::path::Path;

use super::models::{self, item_asset, AssetRole, AssetState, AssetWithRole, SourceType};
use super::storage::VaultStorage;
use super::thumbnail;
use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Service for asset management operations.
pub struct AssetService;

impl AssetService {
    // ── Local File Upload ─────────────────────────────────────────────

    /// Import a local file as an asset and link it to an item with a given role.
    ///
    /// Flow:
    /// 1. Copy file → Vault Storage (UUID filename)
    /// 2. Create Asset record (state = PROCESSING)
    /// 3. Generate thumbnail (if supported image)
    /// 4. Update Asset (thumbnail_path, dimensions, state = READY)
    /// 5. Create ItemAsset link
    pub async fn create_local(
        db: &DatabaseConnection,
        storage: &VaultStorage,
        item_id: i32,
        role: &str,
        file_path: &str,
    ) -> AppResult<AssetWithRole> {
        let source = Path::new(file_path);

        // Validate file exists
        if !source.exists() {
            return Err(AppError::Validation(format!(
                "File not found: {file_path}"
            )));
        }

        // Get extension and detect MIME type
        let ext = source
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin");
        let mime_type = super::storage::mime_from_extension(ext);
        let original_filename = source
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Import file to vault storage
        let import = storage.import_file(source)?;

        // Create Asset record
        let asset_model = models::ActiveModel {
            source_type: Set(SourceType::Local.to_string()),
            media_type: Set("IMAGE".to_string()),
            mime_type: Set(mime_type.to_string()),
            original_filename: Set(original_filename),
            relative_path: Set(Some(import.relative_path.clone())),
            file_size_bytes: Set(Some(import.file_size_bytes)),
            checksum: Set(Some(import.checksum)),
            state: Set(AssetState::Processing.to_string()),
            ..Default::default()
        };

        let asset = asset_model.insert(db).await?;

        // Generate thumbnail (sync, runs on the same thread)
        let mut update_model: models::ActiveModel = asset.clone().into();

        if thumbnail::is_supported_image(ext) {
            let thumb_rel = storage.thumbnail_relative_path(&import.relative_path);
            let thumb_abs = storage.resolve(&thumb_rel);

            match thumbnail::generate_thumbnail(&import.absolute_path, &thumb_abs) {
                Ok(result) => {
                    update_model.thumbnail_path = Set(Some(thumb_rel));
                    update_model.width = Set(Some(result.original_width as i32));
                    update_model.height = Set(Some(result.original_height as i32));
                    update_model.state = Set(AssetState::Ready.to_string());
                }
                Err(e) => {
                    log::warn!("Thumbnail generation failed for asset {}: {e}", asset.id);
                    update_model.state = Set(AssetState::Error.to_string());
                    update_model.error_message =
                        Set(Some(format!("Thumbnail generation failed: {e}")));
                }
            }
        } else {
            // Non-image or unsupported format — mark as ready without thumbnail
            update_model.state = Set(AssetState::Ready.to_string());
        }

        let asset = update_model.update(db).await?;

        // Create ItemAsset link (handle singular role replacement)
        let item_asset = Self::link_asset(db, item_id, asset.id, role).await?;

        Ok(AssetWithRole {
            asset,
            role: item_asset.role,
            display_order: item_asset.display_order,
            item_asset_id: item_asset.id,
        })
    }

    // ── Remote URL Reference ──────────────────────────────────────────

    /// Create a remote asset reference and link it to an item.
    pub async fn create_remote(
        db: &DatabaseConnection,
        item_id: i32,
        role: &str,
        url: &str,
        original_filename: Option<&str>,
    ) -> AppResult<AssetWithRole> {
        // Extract filename from URL if not provided
        let filename = original_filename
            .map(String::from)
            .unwrap_or_else(|| {
                url.rsplit('/')
                    .next()
                    .unwrap_or("remote_image")
                    .to_string()
            });

        let asset_model = models::ActiveModel {
            source_type: Set(SourceType::Remote.to_string()),
            source_url: Set(Some(url.to_string())),
            media_type: Set("IMAGE".to_string()),
            mime_type: Set("image/jpeg".to_string()), // Best guess for remote
            original_filename: Set(filename),
            state: Set(AssetState::Ready.to_string()),
            ..Default::default()
        };

        let asset = asset_model.insert(db).await?;

        // Create ItemAsset link
        let item_asset = Self::link_asset(db, item_id, asset.id, role).await?;

        Ok(AssetWithRole {
            asset,
            role: item_asset.role,
            display_order: item_asset.display_order,
            item_asset_id: item_asset.id,
        })
    }

    // ── Link Management ───────────────────────────────────────────────

    /// Link an asset to an item with a given role.
    ///
    /// For singular roles (COVER, BACKGROUND, LOGO, BANNER), removes
    /// any existing link with the same role before creating the new one.
    async fn link_asset(
        db: &DatabaseConnection,
        item_id: i32,
        asset_id: i32,
        role: &str,
    ) -> AppResult<item_asset::Model> {
        // Parse role to check if singular
        let parsed_role: Option<AssetRole> = match role {
            "COVER" => Some(AssetRole::Cover),
            "BACKGROUND" => Some(AssetRole::Background),
            "LOGO" => Some(AssetRole::Logo),
            "BANNER" => Some(AssetRole::Banner),
            _ => None,
        };

        // For singular roles, remove existing link
        if let Some(ref r) = parsed_role {
            if r.is_singular() {
                item_asset::Entity::delete_many()
                    .filter(item_asset::Column::ItemId.eq(item_id))
                    .filter(item_asset::Column::Role.eq(role))
                    .exec(db)
                    .await?;
            }
        }

        // Create new link
        let link = item_asset::ActiveModel {
            item_id: Set(item_id),
            asset_id: Set(asset_id),
            role: Set(role.to_string()),
            ..Default::default()
        };

        let result = link.insert(db).await?;
        Ok(result)
    }

    // ── Query Operations ──────────────────────────────────────────────

    /// Get the cover asset for a single item (if any).
    pub async fn get_cover_for_item(
        db: &DatabaseConnection,
        item_id: i32,
    ) -> AppResult<Option<models::Model>> {
        let link = item_asset::Entity::find()
            .filter(item_asset::Column::ItemId.eq(item_id))
            .filter(item_asset::Column::Role.eq("COVER"))
            .one(db)
            .await?;

        if let Some(link) = link {
            let asset = models::Entity::find_by_id(link.asset_id).one(db).await?;
            Ok(asset)
        } else {
            Ok(None)
        }
    }

    /// Batch-get cover assets for multiple items.
    ///
    /// This is the critical performance path for Grid/List views.
    /// Returns a map of item_id → Option<Asset>.
    pub async fn get_covers_batch(
        db: &DatabaseConnection,
        item_ids: &[i32],
    ) -> AppResult<HashMap<i32, Option<models::Model>>> {
        if item_ids.is_empty() {
            return Ok(HashMap::new());
        }

        // Find all cover links for the given items in one query
        let links = item_asset::Entity::find()
            .filter(item_asset::Column::ItemId.is_in(item_ids.to_vec()))
            .filter(item_asset::Column::Role.eq("COVER"))
            .all(db)
            .await?;

        // Collect asset IDs
        let asset_ids: Vec<i32> = links.iter().map(|l| l.asset_id).collect();

        // Batch-load all assets
        let assets = if asset_ids.is_empty() {
            vec![]
        } else {
            models::Entity::find()
                .filter(models::Column::Id.is_in(asset_ids))
                .all(db)
                .await?
        };

        // Build asset lookup
        let asset_map: HashMap<i32, models::Model> =
            assets.into_iter().map(|a| (a.id, a)).collect();

        // Build result: item_id → asset
        let mut result: HashMap<i32, Option<models::Model>> = HashMap::new();
        for id in item_ids {
            result.insert(*id, None);
        }
        for link in &links {
            if let Some(asset) = asset_map.get(&link.asset_id) {
                result.insert(link.item_id, Some(asset.clone()));
            }
        }

        Ok(result)
    }

    /// Get all assets for an item, grouped with their roles.
    pub async fn get_assets_for_item(
        db: &DatabaseConnection,
        item_id: i32,
    ) -> AppResult<Vec<AssetWithRole>> {
        let links = item_asset::Entity::find()
            .filter(item_asset::Column::ItemId.eq(item_id))
            .order_by_asc(item_asset::Column::Role)
            .order_by_asc(item_asset::Column::DisplayOrder)
            .all(db)
            .await?;

        if links.is_empty() {
            return Ok(vec![]);
        }

        let asset_ids: Vec<i32> = links.iter().map(|l| l.asset_id).collect();
        let assets = models::Entity::find()
            .filter(models::Column::Id.is_in(asset_ids))
            .all(db)
            .await?;

        let asset_map: HashMap<i32, models::Model> =
            assets.into_iter().map(|a| (a.id, a)).collect();

        let mut result = Vec::with_capacity(links.len());
        for link in links {
            if let Some(asset) = asset_map.get(&link.asset_id) {
                result.push(AssetWithRole {
                    asset: asset.clone(),
                    role: link.role,
                    display_order: link.display_order,
                    item_asset_id: link.id,
                });
            }
        }

        Ok(result)
    }

    /// Get a single asset by ID.
    pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> AppResult<models::Model> {
        models::Entity::find_by_id(id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "Asset".into(),
                field: "id".into(),
                value: id.to_string(),
            })
    }

    // ── Cover Management ──────────────────────────────────────────────

    /// Set an existing asset as the cover for an item.
    ///
    /// Removes any existing cover link and creates a new one.
    pub async fn set_cover(
        db: &DatabaseConnection,
        item_id: i32,
        asset_id: i32,
    ) -> AppResult<item_asset::Model> {
        // Verify asset exists
        Self::get_by_id(db, asset_id).await?;

        // Use link_asset which handles singular role replacement
        Self::link_asset(db, item_id, asset_id, "COVER").await
    }

    // ── Delete ────────────────────────────────────────────────────────

    /// Soft-delete an asset (set state = DELETED).
    ///
    /// Also removes all item_asset links pointing to this asset.
    pub async fn delete(
        db: &DatabaseConnection,
        storage: &VaultStorage,
        asset_id: i32,
    ) -> AppResult<()> {
        let asset = Self::get_by_id(db, asset_id).await?;

        // Remove all links
        item_asset::Entity::delete_many()
            .filter(item_asset::Column::AssetId.eq(asset_id))
            .exec(db)
            .await?;

        // Delete physical files
        if let Some(ref path) = asset.relative_path {
            storage.delete_file(path)?;
        }
        if let Some(ref path) = asset.thumbnail_path {
            storage.delete_file(path)?;
        }
        if let Some(ref path) = asset.preview_path {
            storage.delete_file(path)?;
        }
        if let Some(ref path) = asset.local_cache_path {
            storage.delete_file(path)?;
        }

        // Delete the asset record
        models::Entity::delete_by_id(asset_id).exec(db).await?;

        Ok(())
    }

    /// Remove a specific item-asset link (unlink without deleting the asset).
    pub async fn unlink(db: &DatabaseConnection, item_asset_id: i32) -> AppResult<()> {
        let result = item_asset::Entity::delete_by_id(item_asset_id)
            .exec(db)
            .await?;

        if result.rows_affected == 0 {
            return Err(AppError::NotFound {
                entity: "ItemAsset".into(),
                field: "id".into(),
                value: item_asset_id.to_string(),
            });
        }

        Ok(())
    }
}
