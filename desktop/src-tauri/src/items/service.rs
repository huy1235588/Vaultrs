//! Item business logic.

use sea_orm::*;

use super::models::{self, CreateItemDto, PaginatedResponse, PaginationParams, UpdateItemDto};
use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Service for item management operations.
pub struct ItemService;

impl ItemService {
    /// Get paginated items for a collection.
    pub async fn get_by_collection(
        db: &DatabaseConnection,
        collection_id: i32,
        params: PaginationParams,
    ) -> AppResult<PaginatedResponse<models::Model>> {
        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(50).min(200);

        let paginator = models::Entity::find()
            .filter(models::Column::CollectionId.eq(collection_id))
            .order_by_desc(models::Column::CreatedAt)
            .paginate(db, page_size);

        let total = paginator.num_items().await?;
        let total_pages = paginator.num_pages().await?;
        let data = paginator.fetch_page(page - 1).await?;

        Ok(PaginatedResponse {
            data,
            total,
            page,
            page_size,
            total_pages,
        })
    }

    /// Get a single item by ID.
    pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> AppResult<models::Model> {
        models::Entity::find_by_id(id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "Item".into(),
                field: "id".into(),
                value: id.to_string(),
            })
    }

    /// Create a new item.
    pub async fn create(
        db: &DatabaseConnection,
        dto: CreateItemDto,
    ) -> AppResult<models::Model> {
        let properties = dto
            .properties
            .map(|v| v.to_string())
            .unwrap_or_else(|| "{}".to_string());

        let model = models::ActiveModel {
            collection_id: Set(dto.collection_id),
            title: Set(dto.title),
            properties: Set(properties),
            ..Default::default()
        };

        let result = model.insert(db).await?;
        Ok(result)
    }

    /// Update an existing item.
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        dto: UpdateItemDto,
    ) -> AppResult<models::Model> {
        let existing = Self::get_by_id(db, id).await?;
        let mut model: models::ActiveModel = existing.into();

        if let Some(title) = dto.title {
            model.title = Set(title);
        }
        if let Some(properties) = dto.properties {
            model.properties = Set(properties.to_string());
        }

        let result = model.update(db).await?;
        Ok(result)
    }

    /// Delete an item by ID.
    pub async fn delete(db: &DatabaseConnection, id: i32) -> AppResult<()> {
        let result = models::Entity::delete_by_id(id).exec(db).await?;

        if result.rows_affected == 0 {
            return Err(AppError::NotFound {
                entity: "Item".into(),
                field: "id".into(),
                value: id.to_string(),
            });
        }

        Ok(())
    }
}
