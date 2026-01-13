# ⚙️ Services - Vaultrs

> **Mục tiêu:** Hướng dẫn về Service Layer pattern trong backend Vaultrs.

---

## 📋 TL;DR

| Service             | Responsibility                |
| ------------------- | ----------------------------- |
| `CollectionService` | Collection CRUD, validation   |
| `ItemService`       | Item CRUD, search, pagination |
| `CrawlerService`    | Background metadata fetching  |

---

## 1. 📖 Service Layer Pattern

### Layer Position

```
Commands (Entry)
      ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES                                  │
│  • Business logic                                            │
│  • Validation                                                │
│  • Orchestration of repositories                             │
│  • Background task management                                │
└─────────────────────────────────────────────────────────────┘
      ↓
Repositories (Data Access)
```

### Why Services?

| Benefit             | Explanation                        |
| ------------------- | ---------------------------------- |
| **Separation**      | Commands chỉ parse input/output    |
| **Reusability**     | Logic có thể dùng ở nhiều commands |
| **Testability**     | Dễ mock và unit test               |
| **Maintainability** | Logic tập trung một chỗ            |

---

## 2. 📦 Collection Service

### collection_service.rs

```rust
// src/services/collection_service.rs
use sea_orm::*;
use crate::core::{Result, VaultError};
use crate::models::collection::{self, Collection, Entity as CollectionEntity};

pub struct CollectionService;

impl CollectionService {
    /// Get all collections
    pub async fn get_all(db: &DatabaseConnection) -> Result<Vec<Collection>> {
        let collections = CollectionEntity::find()
            .order_by_asc(collection::Column::Name)
            .all(db)
            .await?;

        Ok(collections)
    }

    /// Get collection by ID
    pub async fn get_by_id(
        db: &DatabaseConnection,
        id: i32,
    ) -> Result<Option<Collection>> {
        let collection = CollectionEntity::find_by_id(id)
            .one(db)
            .await?;

        Ok(collection)
    }

    /// Get collection by slug
    pub async fn get_by_slug(
        db: &DatabaseConnection,
        slug: &str,
    ) -> Result<Option<Collection>> {
        let collection = CollectionEntity::find()
            .filter(collection::Column::Slug.eq(slug))
            .one(db)
            .await?;

        Ok(collection)
    }

    /// Create new collection
    pub async fn create(
        db: &DatabaseConnection,
        name: String,
        slug: String,
        icon: Option<String>,
        description: Option<String>,
    ) -> Result<Collection> {
        // Validation
        Self::validate_name(&name)?;
        Self::validate_slug(&slug)?;
        Self::check_slug_unique(db, &slug).await?;

        // Create model
        let model = collection::ActiveModel {
            name: Set(name),
            slug: Set(slug),
            icon: Set(icon),
            description: Set(description),
            ..Default::default()
        };

        let collection = model.insert(db).await?;
        Ok(collection)
    }

    /// Update existing collection
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        name: Option<String>,
        icon: Option<String>,
        description: Option<String>,
    ) -> Result<Collection> {
        // Get existing
        let existing = Self::get_by_id(db, id)
            .await?
            .ok_or(VaultError::NotFound(format!("Collection {}", id)))?;

        // Validate if name provided
        if let Some(ref n) = name {
            Self::validate_name(n)?;
        }

        // Update
        let mut model: collection::ActiveModel = existing.into();

        if let Some(n) = name {
            model.name = Set(n);
        }
        if let Some(i) = icon {
            model.icon = Set(Some(i));
        }
        if let Some(d) = description {
            model.description = Set(Some(d));
        }

        let updated = model.update(db).await?;
        Ok(updated)
    }

    /// Delete collection (cascades to items)
    pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<()> {
        let result = CollectionEntity::delete_by_id(id)
            .exec(db)
            .await?;

        if result.rows_affected == 0 {
            return Err(VaultError::NotFound(format!("Collection {}", id)));
        }

        Ok(())
    }

    // Validation helpers
    fn validate_name(name: &str) -> Result<()> {
        if name.trim().is_empty() {
            return Err(VaultError::Validation("Name cannot be empty".into()));
        }
        if name.len() > 100 {
            return Err(VaultError::Validation("Name too long (max 100)".into()));
        }
        Ok(())
    }

    fn validate_slug(slug: &str) -> Result<()> {
        if slug.trim().is_empty() {
            return Err(VaultError::Validation("Slug cannot be empty".into()));
        }
        if !slug.chars().all(|c| c.is_alphanumeric() || c == '-') {
            return Err(VaultError::Validation(
                "Slug can only contain alphanumeric and hyphens".into()
            ));
        }
        Ok(())
    }

    async fn check_slug_unique(db: &DatabaseConnection, slug: &str) -> Result<()> {
        if Self::get_by_slug(db, slug).await?.is_some() {
            return Err(VaultError::Validation(
                format!("Slug '{}' already exists", slug)
            ));
        }
        Ok(())
    }
}
```

---

## 3. 📝 Item Service

### item_service.rs

```rust
// src/services/item_service.rs
use sea_orm::*;
use serde_json::Value as JsonValue;
use crate::core::{Result, VaultError};
use crate::models::item::{self, Item, Entity as ItemEntity};
use crate::services::CollectionService;

pub struct ItemService;

impl ItemService {
    /// Get items with pagination and search
    pub async fn get_items(
        db: &DatabaseConnection,
        collection_id: i32,
        offset: u64,
        limit: u64,
        search: Option<String>,
    ) -> Result<Vec<Item>> {
        let mut query = ItemEntity::find()
            .filter(item::Column::CollectionId.eq(collection_id));

        // Apply search filter
        if let Some(ref search_term) = search {
            query = query.filter(
                item::Column::Title.contains(search_term)
            );
        }

        let items = query
            .order_by_desc(item::Column::CreatedAt)
            .offset(offset)
            .limit(limit)
            .all(db)
            .await?;

        Ok(items)
    }

    /// Get single item by ID
    pub async fn get_by_id(
        db: &DatabaseConnection,
        id: i32,
    ) -> Result<Option<Item>> {
        let item = ItemEntity::find_by_id(id)
            .one(db)
            .await?;

        Ok(item)
    }

    /// Create new item
    pub async fn create(
        db: &DatabaseConnection,
        collection_id: i32,
        title: String,
        properties: Option<JsonValue>,
    ) -> Result<Item> {
        // Validation
        Self::validate_title(&title)?;
        Self::validate_collection_exists(db, collection_id).await?;

        let model = item::ActiveModel {
            collection_id: Set(collection_id),
            title: Set(title),
            properties: Set(properties.unwrap_or(JsonValue::Object(Default::default()))),
            ..Default::default()
        };

        let item = model.insert(db).await?;
        Ok(item)
    }

    /// Update item
    pub async fn update(
        db: &DatabaseConnection,
        id: i32,
        title: Option<String>,
        properties: Option<JsonValue>,
    ) -> Result<Item> {
        let existing = Self::get_by_id(db, id)
            .await?
            .ok_or(VaultError::NotFound(format!("Item {}", id)))?;

        if let Some(ref t) = title {
            Self::validate_title(t)?;
        }

        let mut model: item::ActiveModel = existing.into();

        if let Some(t) = title {
            model.title = Set(t);
        }
        if let Some(p) = properties {
            model.properties = Set(p);
        }

        let updated = model.update(db).await?;
        Ok(updated)
    }

    /// Delete item
    pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<()> {
        let result = ItemEntity::delete_by_id(id)
            .exec(db)
            .await?;

        if result.rows_affected == 0 {
            return Err(VaultError::NotFound(format!("Item {}", id)));
        }

        Ok(())
    }

    /// Count items in collection
    pub async fn count(db: &DatabaseConnection, collection_id: i32) -> Result<u64> {
        let count = ItemEntity::find()
            .filter(item::Column::CollectionId.eq(collection_id))
            .count(db)
            .await?;

        Ok(count)
    }

    // Validation helpers
    fn validate_title(title: &str) -> Result<()> {
        if title.trim().is_empty() {
            return Err(VaultError::Validation("Title cannot be empty".into()));
        }
        if title.len() > 255 {
            return Err(VaultError::Validation("Title too long (max 255)".into()));
        }
        Ok(())
    }

    async fn validate_collection_exists(
        db: &DatabaseConnection,
        collection_id: i32
    ) -> Result<()> {
        if CollectionService::get_by_id(db, collection_id).await?.is_none() {
            return Err(VaultError::NotFound(
                format!("Collection {}", collection_id)
            ));
        }
        Ok(())
    }
}
```

---

## 4. 🤖 Crawler Service

### crawler_service.rs

```rust
// src/services/crawler_service.rs
use tokio::sync::mpsc;
use std::sync::Arc;
use sea_orm::DatabaseConnection;
use crate::core::Result;

pub struct CrawlTask {
    pub item_id: i32,
    pub source: String,
    pub external_id: String,
}

pub struct CrawlerService {
    tx: mpsc::Sender<CrawlTask>,
}

impl CrawlerService {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        let (tx, mut rx) = mpsc::channel::<CrawlTask>(100);

        // Spawn background worker
        tokio::spawn(async move {
            while let Some(task) = rx.recv().await {
                if let Err(e) = Self::process_task(&db, task).await {
                    log::error!("Crawler error: {}", e);
                }
            }
        });

        Self { tx }
    }

    /// Queue a crawl task
    pub async fn queue(&self, task: CrawlTask) -> Result<()> {
        self.tx.send(task).await
            .map_err(|e| crate::core::VaultError::Internal(e.to_string()))?;
        Ok(())
    }

    /// Process a single crawl task
    async fn process_task(db: &DatabaseConnection, task: CrawlTask) -> Result<()> {
        log::info!("Processing crawl for item {}", task.item_id);

        // Fetch metadata from external source
        let metadata = Self::fetch_metadata(&task.source, &task.external_id).await?;

        // Update item with metadata
        ItemService::update_properties(db, task.item_id, metadata).await?;

        log::info!("Completed crawl for item {}", task.item_id);
        Ok(())
    }

    async fn fetch_metadata(source: &str, id: &str) -> Result<serde_json::Value> {
        let client = reqwest::Client::new();
        let url = format!("https://api.{}.com/{}", source, id);

        let response = client
            .get(&url)
            .timeout(std::time::Duration::from_secs(10))
            .send()
            .await?;

        let json = response.json().await?;
        Ok(json)
    }
}
```

---

## 5. 📋 Service Registration

### mod.rs

```rust
// src/services/mod.rs
mod collection_service;
mod item_service;
mod crawler_service;

pub use collection_service::CollectionService;
pub use item_service::ItemService;
pub use crawler_service::{CrawlerService, CrawlTask};
```

### In AppState

```rust
// src/lib.rs
pub struct AppState {
    pub db: DatabaseConnection,
    pub crawler: CrawlerService,
}

impl AppState {
    pub async fn new() -> Result<Self> {
        let db = db::init_database().await?;
        let db_arc = Arc::new(db.clone());
        let crawler = CrawlerService::new(db_arc);

        Ok(Self { db, crawler })
    }
}
```

---

## 6. 🧪 Testing Services

### Unit Test Example

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sea_orm::{Database, DbBackend, MockDatabase, MockExecResult};

    #[tokio::test]
    async fn test_create_collection() {
        // Setup mock database
        let db = MockDatabase::new(DbBackend::Sqlite)
            .append_query_results([[collection::Model {
                id: 1,
                name: "Movies".to_string(),
                slug: "movies".to_string(),
                icon: Some("🎬".to_string()),
                description: None,
                created_at: 0,
                updated_at: 0,
            }]])
            .into_connection();

        let result = CollectionService::create(
            &db,
            "Movies".to_string(),
            "movies".to_string(),
            Some("🎬".to_string()),
            None,
        ).await;

        assert!(result.is_ok());
        let collection = result.unwrap();
        assert_eq!(collection.name, "Movies");
    }
}
```

---

## 🔗 Tài liệu Liên quan

-   [Backend Overview](./1-overview.md)
-   [Commands](./2-commands.md)
-   [Error Handling](./3-error-handling.md)

---

_Cập nhật: 2026-01-08_
