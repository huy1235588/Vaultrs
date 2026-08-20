//! Item business logic.

use sea_orm::*;

use super::models::{self, CreateItemDto, PaginatedResponse, PaginationParams, UpdateItemDto};
use crate::core::error::AppError;
use crate::core::result::AppResult;

/// Service for item management operations.
pub struct ItemService;

impl ItemService {
    /// Get paginated items for a collection.
    pub async fn get_by_collection(
        db: &DatabaseConnection,
        collection_id: i32,
        params: PaginationParams,
    ) -> AppResult<PaginatedResponse<models::Model>> {
        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(50).min(200);

        let paginator = models::Entity::find()
            .filter(models::Column::CollectionId.eq(collection_id))
            .order_by_desc(models::Column::CreatedAt)
            .paginate(db, page_size);

        let total = paginator.num_items().await?;
        let total_pages = paginator.num_pages().await?;
        let data = paginator.fetch_page(page - 1).await?;

        Ok(PaginatedResponse {
            data,
            total,
            page,
            page_size,
            total_pages,
        })
    }

    /// Get a single item by ID.
    pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> AppResult<models::Model> {
        models::Entity::find_by_id(id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "Item".into(),
                field: "id".into(),
                value: id.to_string(),
            })
    }

    /// Create a new item.
    pub async fn create(
        db: &DatabaseConnection,
        dto: CreateItemDto,
    ) -> AppResult<models::Model> {
        let properties = dto
            .properties
            .map(|v| v.to_string())
            .unwrap_or_else(|| "{}".to_string());

        let model = models::ActiveModel {
            collection_id: Set(dto.collection_id),
            title: Set(dto.title),
            properties: Set(properties),
            ..Default::default()
        };

        let result = model.insert(db).await?;
        Ok(result)
    }

    /// Update an existing item.
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        dto: UpdateItemDto,
    ) -> AppResult<models::Model> {
        let existing = Self::get_by_id(db, id).await?;
        let mut model: models::ActiveModel = existing.into();

        if let Some(title) = dto.title {
            model.title = Set(title);
        }
        if let Some(properties) = dto.properties {
            model.properties = Set(properties.to_string());
        }

        let result = model.update(db).await?;
        Ok(result)
    }

    /// Delete an item by ID.
    pub async fn delete(db: &DatabaseConnection, id: i32) -> AppResult<()> {
        let result = models::Entity::delete_by_id(id).exec(db).await?;

        if result.rows_affected == 0 {
            return Err(AppError::NotFound {
                entity: "Item".into(),
                field: "id".into(),
                value: id.to_string(),
            });
        }

        Ok(())
    }

    /// Get items using cursor-based pagination (for infinite scroll).
    ///
    /// Supports dynamic sorting by `title`, `created_at`, `updated_at` (or default `id`)
    /// and optional case-insensitive title filtering.
    ///
    /// Uses compound keyset pagination `(sort_col, id)` when sorting by non-id fields,
    /// ensuring O(1) seek regardless of position in the dataset.
    pub async fn get_by_collection_cursor(
        db: &DatabaseConnection,
        collection_id: i32,
        params: models::CursorParams,
    ) -> AppResult<models::CursorResponse<models::Model>> {
        let limit = params.limit.unwrap_or(50).min(200);
        let sort_field = params.sort_field.as_deref().unwrap_or("created_at");
        let sort_order = params.sort_order.as_deref().unwrap_or("DESC");

        // Validate sort field
        let sort_col = match sort_field {
            "title" => "title",
            "created_at" => "created_at",
            "updated_at" => "updated_at",
            _ => "created_at",
        };

        // Validate sort order
        let is_desc = !sort_order.eq_ignore_ascii_case("ASC");
        let order_sql = if is_desc { "DESC" } else { "ASC" };
        // Secondary sort for tie-breaking: always by id in the same direction
        let id_order_sql = if is_desc { "DESC" } else { "ASC" };

        // Comparison operator for keyset cursor
        // DESC order → next page has smaller values → use <
        // ASC order → next page has larger values → use >
        let cmp = if is_desc { "<" } else { ">" };

        // Build WHERE conditions
        let mut conditions = vec!["collection_id = ?1".to_string()];
        let mut bind_values: Vec<sea_orm::Value> = vec![collection_id.into()];
        let mut param_idx: usize = 2;

        // Title filter (case-insensitive LIKE)
        if let Some(ref filter) = params.filter_title {
            let trimmed = filter.trim();
            if !trimmed.is_empty() {
                conditions.push(format!("title LIKE ?{param_idx} COLLATE NOCASE"));
                bind_values.push(format!("%{trimmed}%").into());
                param_idx += 1;
            }
        }

        // Compound cursor condition
        if let (Some(after_id), Some(ref after_sort_val)) =
            (params.after_id, &params.after_sort_value)
        {
            // Compound keyset: (sort_col, id) < (last_sort_val, last_id)
            // For DESC: WHERE (sort_col < ?x) OR (sort_col = ?x AND id < ?y)
            // For ASC:  WHERE (sort_col > ?x) OR (sort_col = ?x AND id > ?y)
            let sv_idx = param_idx;
            let id_idx = param_idx + 1;
            let sv_idx2 = param_idx + 2;

            conditions.push(format!(
                "({sort_col} {cmp} ?{sv_idx} OR ({sort_col} = ?{sv_idx2} AND id {cmp} ?{id_idx}))"
            ));
            bind_values.push(after_sort_val.clone().into());
            bind_values.push(after_id.into());
            bind_values.push(after_sort_val.clone().into());
            param_idx += 3;
        } else if let Some(after_id) = params.after_id {
            // Fallback: simple id cursor (when sort_field == default and no sort_value provided)
            conditions.push(format!("id {cmp} ?{param_idx}"));
            bind_values.push(after_id.into());
            param_idx += 1;
        }

        let where_clause = conditions.join(" AND ");
        let _ = param_idx; // suppress unused warning

        // Data query
        let data_sql = format!(
            "SELECT id, collection_id, title, created_at, updated_at, properties \
             FROM items WHERE {where_clause} \
             ORDER BY {sort_col} {order_sql}, id {id_order_sql} \
             LIMIT {fetch_limit}",
            fetch_limit = limit + 1,
        );

        let backend = sea_orm::DatabaseBackend::Sqlite;
        let items = models::Model::find_by_statement(Statement::from_sql_and_values(
            backend,
            &data_sql,
            bind_values.clone(),
        ))
        .all(db)
        .await?;

        let has_more = items.len() as u64 > limit;
        let data: Vec<models::Model> = items.into_iter().take(limit as usize).collect();

        // Count query (with same filter but no cursor)
        let mut count_conditions = vec!["collection_id = ?1".to_string()];
        let mut count_values: Vec<sea_orm::Value> = vec![collection_id.into()];

        if let Some(ref filter) = params.filter_title {
            let trimmed = filter.trim();
            if !trimmed.is_empty() {
                count_conditions.push("title LIKE ?2 COLLATE NOCASE".to_string());
                count_values.push(format!("%{trimmed}%").into());
            }
        }

        let count_sql = format!(
            "SELECT COUNT(*) AS num FROM items WHERE {}",
            count_conditions.join(" AND ")
        );

        let count_result = db
            .query_one(Statement::from_sql_and_values(
                backend,
                &count_sql,
                count_values,
            ))
            .await?;

        let total = count_result
            .map(|row| row.try_get::<i64>("", "num").unwrap_or(0) as u64)
            .unwrap_or(0);

        Ok(models::CursorResponse {
            data,
            has_more,
            total,
        })
    }
}

