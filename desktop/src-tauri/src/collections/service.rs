//! Collection business logic.

use sea_orm::*;

use super::models::{self, CreateCollectionDto, UpdateCollectionDto};
use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Service for collection management operations.
pub struct CollectionService;

impl CollectionService {
    /// Get all collections.
    pub async fn get_all(db: &DatabaseConnection) -> AppResult<Vec<models::Model>> {
        models::Entity::find()
            .order_by_asc(models::Column::Name)
            .all(db)
            .await
            .map_err(AppError::from)
    }

    /// Get a single collection by ID.
    pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> AppResult<models::Model> {
        models::Entity::find_by_id(id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "Collection".into(),
                field: "id".into(),
                value: id.to_string(),
            })
    }

    /// Create a new collection.
    pub async fn create(
        db: &DatabaseConnection,
        dto: CreateCollectionDto,
    ) -> AppResult<models::Model> {
        let slug = dto.slug.unwrap_or_else(|| slugify(&dto.name));

        let model = models::ActiveModel {
            name: Set(dto.name),
            slug: Set(slug),
            icon: Set(dto.icon),
            description: Set(dto.description),
            ..Default::default()
        };

        let result = model.insert(db).await?;
        Ok(result)
    }

    /// Update an existing collection.
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        dto: UpdateCollectionDto,
    ) -> AppResult<models::Model> {
        let existing = Self::get_by_id(db, id).await?;
        let mut model: models::ActiveModel = existing.into();

        if let Some(name) = dto.name {
            model.name = Set(name);
        }
        if let Some(icon) = dto.icon {
            model.icon = Set(Some(icon));
        }
        if let Some(description) = dto.description {
            model.description = Set(Some(description));
        }

        let result = model.update(db).await?;
        Ok(result)
    }

    /// Delete a collection by ID (cascades to items and attributes).
    pub async fn delete(db: &DatabaseConnection, id: i32) -> AppResult<()> {
        let result = models::Entity::delete_by_id(id).exec(db).await?;

        if result.rows_affected == 0 {
            return Err(AppError::NotFound {
                entity: "Collection".into(),
                field: "id".into(),
                value: id.to_string(),
            });
        }

        Ok(())
    }
}

/// Simple slug generator: lowercase, replace spaces/special chars with hyphens.
fn slugify(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}
