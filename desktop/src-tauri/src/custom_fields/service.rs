//! Attribute business logic.

use sea_orm::*;

use super::models::{self, CreateAttributeDto, UpdateAttributeDto};
use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Service for attribute (custom field) management.
pub struct AttributeService;

impl AttributeService {
    /// Get all attributes for a collection, ordered by display_order.
    pub async fn get_by_collection(
        db: &DatabaseConnection,
        collection_id: i32,
    ) -> AppResult<Vec<models::Model>> {
        models::Entity::find()
            .filter(models::Column::CollectionId.eq(collection_id))
            .order_by_asc(models::Column::DisplayOrder)
            .all(db)
            .await
            .map_err(AppError::from)
    }

    /// Get a single attribute by ID.
    pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> AppResult<models::Model> {
        models::Entity::find_by_id(id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "Attribute".into(),
                field: "id".into(),
                value: id.to_string(),
            })
    }

    /// Create a new attribute.
    pub async fn create(
        db: &DatabaseConnection,
        dto: CreateAttributeDto,
    ) -> AppResult<models::Model> {
        // Validate field type
        dto.field_type
            .parse::<super::models::FieldType>()
            .map_err(|e| AppError::Validation(e))?;

        let options = dto.options.map(|v| v.to_string());

        let model = models::ActiveModel {
            collection_id: Set(dto.collection_id),
            name: Set(dto.name),
            key: Set(dto.key),
            field_type: Set(dto.field_type),
            options: Set(options),
            display_order: Set(dto.display_order),
            required: Set(dto.required.map(|b| b as i32)),
            searchable: Set(dto.searchable.map(|b| b as i32)),
            ..Default::default()
        };

        let result = model.insert(db).await?;
        Ok(result)
    }

    /// Update an existing attribute.
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        dto: UpdateAttributeDto,
    ) -> AppResult<models::Model> {
        let existing = Self::get_by_id(db, id).await?;
        let mut model: models::ActiveModel = existing.into();

        if let Some(name) = dto.name {
            model.name = Set(name);
        }
        if let Some(options) = dto.options {
            model.options = Set(Some(options.to_string()));
        }
        if let Some(display_order) = dto.display_order {
            model.display_order = Set(Some(display_order));
        }
        if let Some(required) = dto.required {
            model.required = Set(Some(required as i32));
        }
        if let Some(searchable) = dto.searchable {
            model.searchable = Set(Some(searchable as i32));
        }

        let result = model.update(db).await?;
        Ok(result)
    }

    /// Delete an attribute by ID.
    pub async fn delete(db: &DatabaseConnection, id: i32) -> AppResult<()> {
        let result = models::Entity::delete_by_id(id).exec(db).await?;

        if result.rows_affected == 0 {
            return Err(AppError::NotFound {
                entity: "Attribute".into(),
                field: "id".into(),
                value: id.to_string(),
            });
        }

        Ok(())
    }
}
