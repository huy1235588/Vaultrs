//! Entry data transfer objects.

use serde::{Deserialize, Serialize};

/// DTO for creating a new entry.
#[derive(Debug, Deserialize)]
pub struct CreateEntryDto {
    pub vault_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub metadata: Option<String>,
}

/// DTO for updating an existing entry.
#[derive(Debug, Deserialize)]
pub struct UpdateEntryDto {
    pub title: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<String>,
}

/// Response DTO for entry data.
#[derive(Debug, Serialize, Clone)]
pub struct EntryDto {
    pub id: i32,
    pub vault_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<crate::entities::entry::Model> for EntryDto {
    fn from(model: crate::entities::entry::Model) -> Self {
        EntryDto {
            id: model.id,
            vault_id: model.vault_id,
            title: model.title,
            description: model.description,
            metadata: model.metadata,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

/// Paginated response for entries.
#[derive(Debug, Serialize)]
pub struct PaginatedEntries {
    pub entries: Vec<EntryDto>,
    pub total: i64,
    pub page: u64,
    pub limit: u64,
    pub has_more: bool,
}

/// Search result response for full-text search.
#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub entries: Vec<EntryDto>,
    pub total: i64,
    pub query: String,
    pub page: u64,
    pub limit: u64,
    pub has_more: bool,
}
