//! Relation service for resolving cross-vault references.

use std::collections::HashMap;

use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, QuerySelect};

use crate::core::AppResult;
use crate::entities::entry::{self, Entity as Entry};
use crate::entities::vault::Entity as Vault;

use super::{EntryPickerItem, RelationRef, ResolvedRelation};

/// Service for relation field operations.
pub struct RelationService;

impl RelationService {
    /// Resolves a single relation reference.
    ///
    /// Returns resolved data with `exists: false` if the entry doesn't exist.
    #[allow(dead_code)]
    pub async fn resolve_single(
        conn: &DatabaseConnection,
        entry_id: i32,
        vault_id: i32,
    ) -> AppResult<ResolvedRelation> {
        // Try to find the entry
        let entry = Entry::find_by_id(entry_id).one(conn).await?;

        match entry {
            Some(e) if e.vault_id == vault_id => {
                // Entry exists and belongs to the expected vault
                let vault_name = Vault::find_by_id(vault_id)
                    .one(conn)
                    .await?
                    .map(|v| v.name);

                Ok(ResolvedRelation {
                    entry_id,
                    vault_id,
                    title: e.title,
                    exists: true,
                    vault_name,
                    cover_image_path: e.cover_image_path,
                })
            }
            _ => {
                // Entry doesn't exist or doesn't belong to the expected vault
                Ok(ResolvedRelation {
                    entry_id,
                    vault_id,
                    title: "[Deleted]".to_string(),
                    exists: false,
                    vault_name: None,
                    cover_image_path: None,
                })
            }
        }
    }

    /// Resolves multiple relation references in batch.
    ///
    /// Returns a HashMap where keys are "entry_id:vault_id" strings.
    /// More efficient than calling resolve_single multiple times.
    pub async fn resolve_batch(
        conn: &DatabaseConnection,
        relations: Vec<RelationRef>,
    ) -> AppResult<HashMap<String, ResolvedRelation>> {
        let mut results = HashMap::new();

        if relations.is_empty() {
            return Ok(results);
        }

        // Collect unique entry IDs to fetch
        let entry_ids: Vec<i32> = relations.iter().map(|r| r.entry_id).collect();

        // Batch fetch all entries
        let entries: HashMap<i32, entry::Model> = Entry::find()
            .filter(entry::Column::Id.is_in(entry_ids))
            .all(conn)
            .await?
            .into_iter()
            .map(|e| (e.id, e))
            .collect();

        // Collect unique vault IDs to fetch names
        let vault_ids: Vec<i32> = relations.iter().map(|r| r.vault_id).collect();
        let vaults: HashMap<i32, String> = Vault::find()
            .filter(crate::entities::vault::Column::Id.is_in(vault_ids))
            .all(conn)
            .await?
            .into_iter()
            .map(|v| (v.id, v.name))
            .collect();

        // Resolve each relation
        for rel in relations {
            let key = rel.to_key();

            let resolved = match entries.get(&rel.entry_id) {
                Some(entry) if entry.vault_id == rel.vault_id => ResolvedRelation {
                    entry_id: rel.entry_id,
                    vault_id: rel.vault_id,
                    title: entry.title.clone(),
                    exists: true,
                    vault_name: vaults.get(&rel.vault_id).cloned(),
                    cover_image_path: entry.cover_image_path.clone(),
                },
                _ => ResolvedRelation {
                    entry_id: rel.entry_id,
                    vault_id: rel.vault_id,
                    title: "[Deleted]".to_string(),
                    exists: false,
                    vault_name: None,
                    cover_image_path: None,
                },
            };

            results.insert(key, resolved);
        }

        Ok(results)
    }

    /// Searches entries in a vault for the relation picker.
    ///
    /// Returns a list of entry summaries matching the search query.
    pub async fn search_entries_for_picker(
        conn: &DatabaseConnection,
        vault_id: i32,
        query: &str,
        limit: i32,
    ) -> AppResult<Vec<EntryPickerItem>> {
        // Verify vault exists
        Vault::find_by_id(vault_id)
            .one(conn)
            .await?
            .ok_or_else(|| crate::core::AppError::VaultNotFound(vault_id))?;

        let query_trimmed = query.trim();
        let limit = limit.max(1).min(100) as u64; // Clamp between 1 and 100

        // Search by title (case-insensitive contains)
        let entries: Vec<entry::Model> = if query_trimmed.is_empty() {
            // If no query, return most recent entries
            Entry::find()
                .filter(entry::Column::VaultId.eq(vault_id))
                .order_by_desc(entry::Column::UpdatedAt)
                .limit(limit)
                .all(conn)
                .await?
        } else {
            // Search by title using LIKE
            Entry::find()
                .filter(entry::Column::VaultId.eq(vault_id))
                .filter(entry::Column::Title.contains(query_trimmed))
                .order_by_desc(entry::Column::UpdatedAt)
                .limit(limit)
                .all(conn)
                .await?
        };

        Ok(entries
            .into_iter()
            .map(|e| EntryPickerItem {
                id: e.id,
                vault_id: e.vault_id,
                title: e.title,
                subtitle: e.description.and_then(|d: String| {
                    // Truncate description for subtitle
                    let d = d.trim();
                    if d.is_empty() {
                        None
                    } else if d.len() > 100 {
                        Some(format!("{}...", &d[..100]))
                    } else {
                        Some(d.to_string())
                    }
                }),
                thumbnail: e.cover_image_path,
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relation_ref_to_key() {
        let rel = RelationRef {
            entry_id: 42,
            vault_id: 5,
        };
        assert_eq!(rel.to_key(), "42:5");
    }
}
