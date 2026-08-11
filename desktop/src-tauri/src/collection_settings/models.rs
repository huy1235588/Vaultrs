//! CollectionSettings data models, SeaORM entity, and JSON DTOs.

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

// ── SeaORM Entity ────────────────────────────────────────────────────

/// SeaORM entity for the `collection_settings` table.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "collection_settings")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub collection_id: i32,
    #[sea_orm(column_type = "Text")]
    pub appearance: String,
    #[sea_orm(column_type = "Text")]
    pub media: String,
    #[sea_orm(column_type = "Text")]
    pub behavior: String,
    pub created_at: i64,
    pub updated_at: i64,
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

// ── JSON Settings DTOs ───────────────────────────────────────────────

/// Appearance settings — UI layout and display preferences.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    #[serde(default = "default_view_mode")]
    pub default_view_mode: String,
    #[serde(default = "default_card_size")]
    pub card_size: String,
    #[serde(default = "default_true")]
    pub show_title_on_card: bool,
}

fn default_view_mode() -> String {
    "LIST".to_string()
}
fn default_card_size() -> String {
    "MEDIUM".to_string()
}
fn default_true() -> bool {
    true
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            default_view_mode: default_view_mode(),
            card_size: default_card_size(),
            show_title_on_card: true,
        }
    }
}

/// Media settings — media feature configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaSettings {
    #[serde(default)]
    pub media_enabled: bool,
    #[serde(default = "default_true")]
    pub cover_enabled: bool,
    #[serde(default = "default_cover_mode")]
    pub default_cover_mode: String,
    #[serde(default)]
    pub default_cover_asset_id: Option<i32>,
    #[serde(default = "default_allowed_roles")]
    pub allowed_roles: Vec<String>,
}

fn default_cover_mode() -> String {
    "SYSTEM".to_string()
}
fn default_allowed_roles() -> Vec<String> {
    vec![
        "COVER".to_string(),
        "GALLERY".to_string(),
        "SCREENSHOT".to_string(),
        "ATTACHMENT".to_string(),
    ]
}

impl Default for MediaSettings {
    fn default() -> Self {
        Self {
            media_enabled: false,
            cover_enabled: true,
            default_cover_mode: default_cover_mode(),
            default_cover_asset_id: None,
            allowed_roles: default_allowed_roles(),
        }
    }
}

/// Behavior settings — sorting and loading preferences.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorSettings {
    #[serde(default = "default_sort_field")]
    pub default_sort_field: String,
    #[serde(default = "default_sort_order")]
    pub default_sort_order: String,
}

fn default_sort_field() -> String {
    "created_at".to_string()
}
fn default_sort_order() -> String {
    "DESC".to_string()
}

impl Default for BehaviorSettings {
    fn default() -> Self {
        Self {
            default_sort_field: default_sort_field(),
            default_sort_order: default_sort_order(),
        }
    }
}

// ── Parsed Settings ──────────────────────────────────────────────────

/// Fully parsed settings response sent to frontend.
#[derive(Debug, Serialize)]
pub struct ParsedSettings {
    pub id: i32,
    pub collection_id: i32,
    pub appearance: AppearanceSettings,
    pub media: MediaSettings,
    pub behavior: BehaviorSettings,
    pub created_at: i64,
    pub updated_at: i64,
}

// ── Update DTO ───────────────────────────────────────────────────────

/// DTO for partially updating collection settings.
/// Each field is optional — only provided fields are merged.
#[derive(Debug, Deserialize)]
pub struct UpdateSettingsDto {
    pub appearance: Option<AppearanceSettings>,
    pub media: Option<MediaSettings>,
    pub behavior: Option<BehaviorSettings>,
}
