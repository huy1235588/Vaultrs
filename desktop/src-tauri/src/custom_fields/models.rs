//! Attribute (custom field) data models and SeaORM entity.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Supported field types for custom attributes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FieldType {
    Text,
    Textarea,
    Number,
    Decimal,
    Date,
    Datetime,
    Select,
    Multiselect,
    Checkbox,
    Url,
    Image,
    File,
}

impl std::fmt::Display for FieldType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = serde_json::to_value(self)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default();
        write!(f, "{s}")
    }
}

impl std::str::FromStr for FieldType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let quoted = format!("\"{s}\"");
        serde_json::from_str(&quoted).map_err(|_| format!("Unknown field type: {s}"))
    }
}

/// SeaORM entity for the `attributes` table.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "attributes")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub collection_id: i32,
    pub name: String,
    pub key: String,
    #[sea_orm(column_name = "type")]
    pub field_type: String,
    pub options: Option<String>,
    pub display_order: Option<i32>,
    pub required: Option<i32>,
    pub searchable: Option<i32>,
    pub created_at: i64,
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

/// DTO for creating a new attribute.
#[derive(Debug, Deserialize)]
pub struct CreateAttributeDto {
    pub collection_id: i32,
    pub name: String,
    pub key: String,
    pub field_type: String,
    pub options: Option<serde_json::Value>,
    pub display_order: Option<i32>,
    pub required: Option<bool>,
    pub searchable: Option<bool>,
}

/// DTO for updating an existing attribute.
#[derive(Debug, Deserialize)]
pub struct UpdateAttributeDto {
    pub name: Option<String>,
    pub options: Option<serde_json::Value>,
    pub display_order: Option<i32>,
    pub required: Option<bool>,
    pub searchable: Option<bool>,
}
