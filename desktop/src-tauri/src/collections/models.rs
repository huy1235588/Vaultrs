//! Collection data models and SeaORM entity.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// SeaORM entity for the `collections` table.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "collections")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    #[sea_orm(unique)]
    pub slug: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::super::items::models::Entity")]
    Items,
    #[sea_orm(has_many = "super::super::custom_fields::models::Entity")]
    Attributes,
    #[sea_orm(has_one = "super::super::collection_settings::models::Entity")]
    Settings,
}

impl Related<super::super::items::models::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Items.def()
    }
}

impl Related<super::super::custom_fields::models::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Attributes.def()
    }
}

impl Related<super::super::collection_settings::models::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Settings.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

// --- DTOs ---

/// DTO for creating a new collection.
#[derive(Debug, Deserialize)]
pub struct CreateCollectionDto {
    pub name: String,
    pub slug: Option<String>,
    pub icon: Option<String>,
    pub description: Option<String>,
}

/// DTO for updating an existing collection.
#[derive(Debug, Deserialize)]
pub struct UpdateCollectionDto {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub description: Option<String>,
}
