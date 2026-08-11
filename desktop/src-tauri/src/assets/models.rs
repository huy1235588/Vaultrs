//! Asset and ItemAsset data models, SeaORM entities, enums, and DTOs.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

// ═══════════════════════════════════════════════════════════════════════
// Assets Entity
// ═══════════════════════════════════════════════════════════════════════

/// SeaORM entity for the `assets` table.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "assets")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub source_type: String,
    pub source_url: Option<String>,
    pub media_type: String,
    pub mime_type: String,
    pub original_filename: String,
    pub relative_path: Option<String>,
    pub local_cache_path: Option<String>,
    pub thumbnail_path: Option<String>,
    pub preview_path: Option<String>,
    pub file_size_bytes: Option<i64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub checksum: Option<String>,
    pub state: String,
    pub error_message: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub metadata: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

// ═══════════════════════════════════════════════════════════════════════
// ItemAssets Entity
// ═══════════════════════════════════════════════════════════════════════

/// Module for the `item_assets` junction table entity.
pub mod item_asset {
    use sea_orm::entity::prelude::*;
    use serde::{Deserialize, Serialize};

    /// SeaORM entity for the `item_assets` table.
    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
    #[sea_orm(table_name = "item_assets")]
    pub struct Model {
        #[sea_orm(primary_key)]
        pub id: i32,
        pub item_id: i32,
        pub asset_id: i32,
        pub role: String,
        pub display_order: Option<i32>,
        pub created_at: i64,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {
        #[sea_orm(
            belongs_to = "super::Entity",
            from = "Column::AssetId",
            to = "super::Column::Id"
        )]
        Asset,
        #[sea_orm(
            belongs_to = "crate::items::models::Entity",
            from = "Column::ItemId",
            to = "crate::items::models::Column::Id"
        )]
        Item,
    }

    impl Related<super::Entity> for Entity {
        fn to() -> RelationDef {
            Relation::Asset.def()
        }
    }

    impl Related<crate::items::models::Entity> for Entity {
        fn to() -> RelationDef {
            Relation::Item.def()
        }
    }

    impl ActiveModelBehavior for ActiveModel {}
}

// ═══════════════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════════════

/// Asset source type.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SourceType {
    #[serde(rename = "LOCAL")]
    Local,
    #[serde(rename = "REMOTE")]
    Remote,
}

impl std::fmt::Display for SourceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Local => write!(f, "LOCAL"),
            Self::Remote => write!(f, "REMOTE"),
        }
    }
}

/// Asset state in the lifecycle.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AssetState {
    #[serde(rename = "PROCESSING")]
    Processing,
    #[serde(rename = "READY")]
    Ready,
    #[serde(rename = "CACHED")]
    Cached,
    #[serde(rename = "ERROR")]
    Error,
    #[serde(rename = "MISSING")]
    Missing,
    #[serde(rename = "DELETED")]
    Deleted,
}

impl std::fmt::Display for AssetState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Processing => write!(f, "PROCESSING"),
            Self::Ready => write!(f, "READY"),
            Self::Cached => write!(f, "CACHED"),
            Self::Error => write!(f, "ERROR"),
            Self::Missing => write!(f, "MISSING"),
            Self::Deleted => write!(f, "DELETED"),
        }
    }
}

/// Asset role in the context of an Item.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AssetRole {
    #[serde(rename = "COVER")]
    Cover,
    #[serde(rename = "BACKGROUND")]
    Background,
    #[serde(rename = "LOGO")]
    Logo,
    #[serde(rename = "BANNER")]
    Banner,
    #[serde(rename = "GALLERY")]
    Gallery,
    #[serde(rename = "SCREENSHOT")]
    Screenshot,
    #[serde(rename = "ATTACHMENT")]
    Attachment,
}

impl std::fmt::Display for AssetRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Cover => write!(f, "COVER"),
            Self::Background => write!(f, "BACKGROUND"),
            Self::Logo => write!(f, "LOGO"),
            Self::Banner => write!(f, "BANNER"),
            Self::Gallery => write!(f, "GALLERY"),
            Self::Screenshot => write!(f, "SCREENSHOT"),
            Self::Attachment => write!(f, "ATTACHMENT"),
        }
    }
}

impl AssetRole {
    /// Returns true for roles limited to 1 per item.
    pub fn is_singular(&self) -> bool {
        matches!(
            self,
            Self::Cover | Self::Background | Self::Logo | Self::Banner
        )
    }
}

// ═══════════════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════════════

/// DTO for creating a local asset (file upload).
#[derive(Debug, Deserialize)]
pub struct CreateLocalAssetDto {
    pub item_id: i32,
    pub role: String,
    pub file_path: String,
}

/// DTO for creating a remote asset (URL reference).
#[derive(Debug, Deserialize)]
pub struct CreateRemoteAssetDto {
    pub item_id: i32,
    pub role: String,
    pub url: String,
    pub original_filename: Option<String>,
}

/// Asset with its role context (joined from item_assets).
#[derive(Debug, Serialize)]
pub struct AssetWithRole {
    #[serde(flatten)]
    pub asset: Model,
    pub role: String,
    pub display_order: Option<i32>,
    pub item_asset_id: i32,
}

/// Batch cover response — maps item IDs to their cover assets.
#[derive(Debug, Serialize)]
pub struct CoverBatchResponse {
    /// Map of item_id → cover asset (None if no cover).
    pub covers: std::collections::HashMap<i32, Option<Model>>,
}
