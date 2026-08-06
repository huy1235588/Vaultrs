//! Item data models and SeaORM entity.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// SeaORM entity for the `items` table.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "items")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub collection_id: i32,
    pub title: String,
    pub created_at: i64,
    pub updated_at: i64,
    #[sea_orm(column_type = "Text")]
    pub properties: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::super::collections::models::Entity",
        from = "Column::CollectionId",
        to = "super::super::collections::models::Column::Id"
    )]
    Collection,
}

impl Related<super::super::collections::models::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Collection.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

// --- DTOs ---

/// DTO for creating a new item.
#[derive(Debug, Deserialize)]
pub struct CreateItemDto {
    pub collection_id: i32,
    pub title: String,
    pub properties: Option<serde_json::Value>,
}

/// DTO for updating an existing item.
#[derive(Debug, Deserialize)]
pub struct UpdateItemDto {
    pub title: Option<String>,
    pub properties: Option<serde_json::Value>,
}

/// Paginated query parameters.
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

/// Paginated response wrapper.
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

/// Cursor-based pagination parameters (for infinite scroll).
#[derive(Debug, Deserialize)]
pub struct CursorParams {
    /// ID of the last item from the previous page (None for first page).
    pub after_id: Option<i32>,
    /// Number of items to fetch (default: 50, max: 200).
    pub limit: Option<u64>,
}

/// Cursor-based paginated response.
#[derive(Debug, Serialize)]
pub struct CursorResponse<T: Serialize> {
    pub data: Vec<T>,
    /// Whether there are more items after this batch.
    pub has_more: bool,
    /// Total count of items in the collection (for UI display).
    pub total: u64,
}
