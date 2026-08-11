//! CollectionSettings business logic.

use sea_orm::*;

use super::models::{
    self, AppearanceSettings, BehaviorSettings, MediaSettings, ParsedSettings, UpdateSettingsDto,
};
use crate::core::result::AppResult;

/// Service for collection settings operations.
pub struct CollectionSettingsService;

impl CollectionSettingsService {
    /// Get settings for a collection, parsing JSON into typed DTOs.
    ///
    /// If settings don't exist yet (edge case: collection created before
    /// the migration added the auto-create trigger), creates default settings.
    pub async fn get_by_collection(
        db: &DatabaseConnection,
        collection_id: i32,
    ) -> AppResult<ParsedSettings> {
        let settings = models::Entity::find()
            .filter(models::Column::CollectionId.eq(collection_id))
            .one(db)
            .await?;

        let settings = match settings {
            Some(s) => s,
            None => Self::ensure_exists(db, collection_id).await?,
        };

        Self::parse_model(settings)
    }

    /// Update settings for a collection. Merges provided fields with existing values.
    pub async fn update(
        db: &DatabaseConnection,
        collection_id: i32,
        dto: UpdateSettingsDto,
    ) -> AppResult<ParsedSettings> {
        // Get existing settings (or create defaults)
        let existing = models::Entity::find()
            .filter(models::Column::CollectionId.eq(collection_id))
            .one(db)
            .await?;

        let existing = match existing {
            Some(s) => s,
            None => Self::ensure_exists(db, collection_id).await?,
        };

        let mut model: models::ActiveModel = existing.clone().into();

        // Merge appearance
        if let Some(appearance) = dto.appearance {
            model.appearance = Set(serde_json::to_string(&appearance)?);
        }

        // Merge media
        if let Some(media) = dto.media {
            model.media = Set(serde_json::to_string(&media)?);
        }

        // Merge behavior
        if let Some(behavior) = dto.behavior {
            model.behavior = Set(serde_json::to_string(&behavior)?);
        }

        let result = model.update(db).await?;
        Self::parse_model(result)
    }

    /// Ensure a CollectionSettings record exists for the given collection.
    /// Creates one with defaults if missing.
    pub async fn ensure_exists(
        db: &DatabaseConnection,
        collection_id: i32,
    ) -> AppResult<models::Model> {
        let model = models::ActiveModel {
            collection_id: Set(collection_id),
            appearance: Set(serde_json::to_string(&AppearanceSettings::default())?),
            media: Set(serde_json::to_string(&MediaSettings::default())?),
            behavior: Set(serde_json::to_string(&BehaviorSettings::default())?),
            ..Default::default()
        };

        let result = model.insert(db).await?;
        Ok(result)
    }

    /// Parse a raw model into typed settings DTOs.
    fn parse_model(model: models::Model) -> AppResult<ParsedSettings> {
        let appearance: AppearanceSettings = serde_json::from_str(&model.appearance)
            .unwrap_or_default();
        let media: MediaSettings = serde_json::from_str(&model.media)
            .unwrap_or_default();
        let behavior: BehaviorSettings = serde_json::from_str(&model.behavior)
            .unwrap_or_default();

        Ok(ParsedSettings {
            id: model.id,
            collection_id: model.collection_id,
            appearance,
            media,
            behavior,
            created_at: model.created_at,
            updated_at: model.updated_at,
        })
    }
}
