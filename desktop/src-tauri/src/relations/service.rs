//! Relation service — business logic for cross-collection item linking.
//!
//! Resolves reference IDs stored in item properties JSON into enriched item
//! data, provides search for the reference picker UI, and performs reverse
//! lookups (back-references).

use sea_orm::*;
use std::collections::HashMap;

use super::models::{BackReference, ReferencedItem, ResolvedReferencesResponse};
use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Service for cross-collection relation operations.
pub struct RelationService;

impl RelationService {
    /// Resolve reference IDs stored in an item's properties JSON.
    ///
    /// For each attribute key provided, extracts the array of item IDs from
    /// the item's `properties` JSON and JOINs with `items` + `collections`
    /// to return enriched data.
    pub async fn resolve_references(
        db: &DatabaseConnection,
        item_id: i32,
        attribute_keys: Vec<String>,
    ) -> AppResult<ResolvedReferencesResponse> {
        if attribute_keys.is_empty() {
            return Ok(ResolvedReferencesResponse {
                references: HashMap::new(),
            });
        }

        // 1. Load the item's properties JSON
        let row = db
            .query_one(Statement::from_sql_and_values(
                DatabaseBackend::Sqlite,
                "SELECT properties FROM items WHERE id = ?1",
                vec![item_id.into()],
            ))
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "Item".into(),
                field: "id".into(),
                value: item_id.to_string(),
            })?;

        let properties_str: String = row.try_get("", "properties").unwrap_or_default();
        let properties: serde_json::Value =
            serde_json::from_str(&properties_str).unwrap_or(serde_json::Value::Object(
                serde_json::Map::new(),
            ));

        // 2. Extract all referenced IDs across all attribute keys
        let mut all_ids: Vec<i32> = Vec::new();
        let mut key_id_map: HashMap<String, Vec<i32>> = HashMap::new();

        for key in &attribute_keys {
            let ids = match properties.get(key) {
                Some(serde_json::Value::Array(arr)) => arr
                    .iter()
                    .filter_map(|v| v.as_i64().map(|n| n as i32))
                    .collect::<Vec<_>>(),
                Some(serde_json::Value::Number(n)) => {
                    // Single reference (not array)
                    n.as_i64().map(|id| vec![id as i32]).unwrap_or_default()
                }
                _ => Vec::new(),
            };

            all_ids.extend(&ids);
            key_id_map.insert(key.clone(), ids);
        }

        if all_ids.is_empty() {
            return Ok(ResolvedReferencesResponse {
                references: attribute_keys
                    .iter()
                    .map(|k| (k.clone(), Vec::new()))
                    .collect(),
            });
        }

        // 3. Batch-query all referenced items + their collection data
        all_ids.sort_unstable();
        all_ids.dedup();

        let placeholders: String = all_ids
            .iter()
            .enumerate()
            .map(|(i, _)| format!("?{}", i + 1))
            .collect::<Vec<_>>()
            .join(", ");

        let sql = format!(
            "SELECT i.id, i.title, i.collection_id, c.name AS collection_name, c.icon AS collection_icon \
             FROM items i JOIN collections c ON i.collection_id = c.id \
             WHERE i.id IN ({placeholders})"
        );

        let values: Vec<sea_orm::Value> = all_ids.iter().map(|id| (*id).into()).collect();

        let rows = db
            .query_all(Statement::from_sql_and_values(
                DatabaseBackend::Sqlite,
                &sql,
                values,
            ))
            .await?;

        // Build a lookup map: id → ReferencedItem
        let mut item_map: HashMap<i32, ReferencedItem> = HashMap::new();
        for row in rows {
            let id: i32 = row.try_get("", "id").unwrap_or(0);
            item_map.insert(
                id,
                ReferencedItem {
                    id,
                    title: row.try_get("", "title").unwrap_or_default(),
                    collection_id: row.try_get("", "collection_id").unwrap_or(0),
                    collection_name: row.try_get("", "collection_name").unwrap_or_default(),
                    collection_icon: row.try_get("", "collection_icon").ok(),
                },
            );
        }

        // 4. Build the response grouped by attribute key, preserving original order
        let mut references: HashMap<String, Vec<ReferencedItem>> = HashMap::new();
        for (key, ids) in &key_id_map {
            let items: Vec<ReferencedItem> = ids
                .iter()
                .filter_map(|id| {
                    item_map.get(id).map(|item| ReferencedItem {
                        id: item.id,
                        title: item.title.clone(),
                        collection_id: item.collection_id,
                        collection_name: item.collection_name.clone(),
                        collection_icon: item.collection_icon.clone(),
                    })
                })
                .collect();
            references.insert(key.clone(), items);
        }

        Ok(ResolvedReferencesResponse { references })
    }

    /// Search for items in a target collection (for the reference picker UI).
    ///
    /// Performs a case-insensitive LIKE search on the title field, optionally
    /// excluding already-selected item IDs.
    pub async fn search_reference_targets(
        db: &DatabaseConnection,
        collection_id: i32,
        query: Option<String>,
        exclude_ids: Option<Vec<i32>>,
        limit: Option<u64>,
    ) -> AppResult<Vec<ReferencedItem>> {
        let limit = limit.unwrap_or(20).min(50);
        let mut conditions = vec!["i.collection_id = ?1".to_string()];
        let mut values: Vec<sea_orm::Value> = vec![collection_id.into()];
        let mut param_idx: usize = 2;

        // Title search filter
        if let Some(ref q) = query {
            let trimmed = q.trim();
            if !trimmed.is_empty() {
                conditions.push(format!("i.title LIKE ?{param_idx} COLLATE NOCASE"));
                values.push(format!("%{trimmed}%").into());
                param_idx += 1;
            }
        }

        // Exclude already-selected IDs
        if let Some(ref ids) = exclude_ids {
            if !ids.is_empty() {
                let placeholders: String = ids
                    .iter()
                    .enumerate()
                    .map(|(i, _)| format!("?{}", param_idx + i))
                    .collect::<Vec<_>>()
                    .join(", ");
                conditions.push(format!("i.id NOT IN ({placeholders})"));
                for id in ids {
                    values.push((*id).into());
                }
                param_idx += ids.len();
            }
        }

        let _ = param_idx; // suppress unused warning

        let where_clause = conditions.join(" AND ");
        let sql = format!(
            "SELECT i.id, i.title, i.collection_id, c.name AS collection_name, c.icon AS collection_icon \
             FROM items i JOIN collections c ON i.collection_id = c.id \
             WHERE {where_clause} \
             ORDER BY i.title ASC \
             LIMIT {limit}"
        );

        let rows = db
            .query_all(Statement::from_sql_and_values(
                DatabaseBackend::Sqlite,
                &sql,
                values,
            ))
            .await?;

        let results = rows
            .into_iter()
            .map(|row| ReferencedItem {
                id: row.try_get("", "id").unwrap_or(0),
                title: row.try_get("", "title").unwrap_or_default(),
                collection_id: row.try_get("", "collection_id").unwrap_or(0),
                collection_name: row.try_get("", "collection_name").unwrap_or_default(),
                collection_icon: row.try_get("", "collection_icon").ok(),
            })
            .collect();

        Ok(results)
    }

    /// Find all items that reference a given item (reverse lookup / back-references).
    ///
    /// Scans all attributes with `type = 'reference'`, then uses SQLite JSON
    /// functions to find items whose properties contain the target item ID
    /// in the corresponding reference arrays.
    pub async fn get_back_references(
        db: &DatabaseConnection,
        item_id: i32,
    ) -> AppResult<Vec<BackReference>> {
        // 1. Find all reference-type attributes
        let attr_rows = db
            .query_all(Statement::from_sql_and_values(
                DatabaseBackend::Sqlite,
                "SELECT id, collection_id, name, key, options FROM attributes WHERE type = 'reference'",
                vec![],
            ))
            .await?;

        if attr_rows.is_empty() {
            return Ok(Vec::new());
        }

        // 2. For each reference attribute, find items containing our target ID
        //    Uses json_each() to unnest the JSON array and match individual values.
        let mut back_refs: Vec<BackReference> = Vec::new();

        for attr_row in &attr_rows {
            let attr_key: String = attr_row.try_get("", "key").unwrap_or_default();
            let attr_name: String = attr_row.try_get("", "name").unwrap_or_default();
            let attr_collection_id: i32 = attr_row.try_get("", "collection_id").unwrap_or(0);

            // Parse options to find target_collection_id (for display context)
            let options_str: String = attr_row.try_get("", "options").unwrap_or_default();
            let _options: serde_json::Value =
                serde_json::from_str(&options_str).unwrap_or(serde_json::Value::Null);

            // Query items in this attribute's collection whose properties[key] array contains item_id
            let sql = format!(
                "SELECT i.id, i.title, i.collection_id, c.name AS collection_name, c.icon AS collection_icon \
                 FROM items i \
                 JOIN collections c ON i.collection_id = c.id \
                 WHERE i.collection_id = ?1 \
                 AND EXISTS ( \
                     SELECT 1 FROM json_each(json_extract(i.properties, '$.{attr_key}')) je \
                     WHERE je.value = ?2 \
                 )"
            );

            let rows = db
                .query_all(Statement::from_sql_and_values(
                    DatabaseBackend::Sqlite,
                    &sql,
                    vec![attr_collection_id.into(), item_id.into()],
                ))
                .await?;

            for row in rows {
                back_refs.push(BackReference {
                    item_id: row.try_get("", "id").unwrap_or(0),
                    item_title: row.try_get("", "title").unwrap_or_default(),
                    collection_id: row.try_get("", "collection_id").unwrap_or(0),
                    collection_name: row.try_get("", "collection_name").unwrap_or_default(),
                    collection_icon: row.try_get("", "collection_icon").ok(),
                    attribute_name: attr_name.clone(),
                });
            }
        }

        Ok(back_refs)
    }
}
