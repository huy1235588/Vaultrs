//! Relation DTOs for cross-collection item linking.

use serde::{Deserialize, Serialize};

/// A resolved reference — an item from another collection with its context.
#[derive(Debug, Serialize)]
pub struct ReferencedItem {
    pub id: i32,
    pub title: String,
    pub collection_id: i32,
    pub collection_name: String,
    pub collection_icon: Option<String>,
}

/// A back-reference — an item from another collection that references the target item.
#[derive(Debug, Serialize)]
pub struct BackReference {
    pub item_id: i32,
    pub item_title: String,
    pub collection_id: i32,
    pub collection_name: String,
    pub collection_icon: Option<String>,
    pub attribute_name: String,
}

/// DTO for resolving references on an item.
#[derive(Debug, Deserialize)]
pub struct ResolveReferencesDto {
    pub item_id: i32,
    pub attribute_keys: Vec<String>,
}

/// Grouped resolved references keyed by attribute key.
#[derive(Debug, Serialize)]
pub struct ResolvedReferencesResponse {
    /// Map of attribute_key → list of referenced items.
    pub references: std::collections::HashMap<String, Vec<ReferencedItem>>,
}

/// DTO for searching items in a target collection (for the reference picker).
#[derive(Debug, Deserialize)]
pub struct ReferenceSearchDto {
    pub collection_id: i32,
    pub query: Option<String>,
    pub exclude_ids: Option<Vec<i32>>,
    pub limit: Option<u64>,
}
