//! Relation field data transfer objects.

use serde::{Deserialize, Serialize};

/// Value stored in entry metadata for a relation field.
/// Contains the referenced entry ID and vault ID.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[allow(dead_code)]
pub struct RelationValue {
    pub entry_id: i32,
    pub vault_id: i32,
}

/// Reference to a relation for batch resolution requests.
#[derive(Debug, Clone, Deserialize)]
pub struct RelationRef {
    pub entry_id: i32,
    pub vault_id: i32,
}

impl RelationRef {
    /// Creates a unique key for this relation reference.
    pub fn to_key(&self) -> String {
        format!("{}:{}", self.entry_id, self.vault_id)
    }
}

/// Resolved relation data for display.
/// Includes the original reference plus resolved entry information.
#[derive(Debug, Clone, Serialize)]
pub struct ResolvedRelation {
    /// The entry ID that was referenced
    pub entry_id: i32,
    /// The vault ID that was referenced
    pub vault_id: i32,
    /// The title of the referenced entry (or "[Deleted]" if not found)
    pub title: String,
    /// Whether the referenced entry still exists
    pub exists: bool,
    /// The name of the target vault (if exists)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vault_name: Option<String>,
    /// Cover image path of the referenced entry (if exists)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cover_image_path: Option<String>,
}

/// Entry summary for relation picker UI.
/// Provides minimal information for displaying in a search/select dropdown.
#[derive(Debug, Clone, Serialize)]
pub struct EntryPickerItem {
    /// Entry ID
    pub id: i32,
    /// Vault ID the entry belongs to
    pub vault_id: i32,
    /// Entry title
    pub title: String,
    /// Optional subtitle (e.g., description snippet)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subtitle: Option<String>,
    /// Optional thumbnail/cover image path
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
}
