# 🎨 Design Patterns - Vaultrs

> **Mục tiêu:** Mô tả các design patterns được áp dụng trong dự án Vaultrs và lý do lựa chọn.

---

## 📋 TL;DR

| Pattern             | Layer    | Purpose                          |
| ------------------- | -------- | -------------------------------- |
| Repository          | Backend  | Abstract data access             |
| Service Layer       | Backend  | Encapsulate business logic       |
| Command             | IPC      | Frontend-Backend communication   |
| Observer/Event      | Both     | Async notifications              |
| Builder             | Backend  | Complex object construction      |
| Module Pattern      | Both     | Code organization                |

---

## 1. 🗃️ Repository Pattern

### Mục đích

Tách biệt logic truy cập dữ liệu khỏi business logic.

### Implementation

```rust
// Trait definition
pub trait ItemRepository: Send + Sync {
    async fn find_by_id(&self, id: i32) -> Result<Option<Item>>;
    async fn find_all(&self, params: QueryParams) -> Result<Vec<Item>>;
    async fn create(&self, item: CreateItem) -> Result<Item>;
    async fn update(&self, id: i32, item: UpdateItem) -> Result<Item>;
    async fn delete(&self, id: i32) -> Result<()>;
}

// Concrete implementation
pub struct SqliteItemRepository {
    db: Arc<DatabaseConnection>,
}

impl ItemRepository for SqliteItemRepository {
    async fn find_by_id(&self, id: i32) -> Result<Option<Item>> {
        item::Entity::find_by_id(id)
            .one(&*self.db)
            .await
            .map_err(Into::into)
    }
    // ...
}
```

### Benefits

- ✅ Testable (mock repositories)
- ✅ Swappable implementations
- ✅ Clear separation of concerns

---

## 2. ⚙️ Service Layer Pattern

### Mục đích

Đóng gói business logic tại một layer riêng biệt.

### Implementation

```rust
pub struct ItemService {
    repository: Arc<dyn ItemRepository>,
    validator: Arc<Validator>,
}

impl ItemService {
    pub async fn create_item(&self, data: CreateItemDto) -> Result<Item> {
        // 1. Validate
        self.validator.validate(&data)?;
        
        // 2. Business rules
        if data.title.len() > 255 {
            return Err(ValidationError::TitleTooLong.into());
        }
        
        // 3. Persist
        let item = self.repository.create(data.into()).await?;
        
        // 4. Side effects (if any)
        // emit_event("item_created", &item);
        
        Ok(item)
    }
}
```

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMANDS (Entry Points)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES (Business Logic)                 │
│  - Validation                                               │
│  - Business rules                                           │
│  - Orchestration                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    REPOSITORIES (Data Access)                │
│  - CRUD operations                                          │
│  - Query building                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 🎮 Command Pattern (Tauri)

### Mục đích

Định nghĩa entry points cho frontend gọi vào backend.

### Implementation

```rust
#[tauri::command]
async fn get_items(
    state: State<'_, AppState>,
    collection_id: i32,
    offset: u64,
    limit: u64,
) -> Result<Vec<ItemDto>, String> {
    state.item_service
        .get_items(collection_id, offset, limit)
        .await
        .map(|items| items.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_item(
    state: State<'_, AppState>,
    data: CreateItemDto,
) -> Result<ItemDto, String> {
    state.item_service
        .create_item(data)
        .await
        .map(Into::into)
        .map_err(|e| e.to_string())
}
```

### Registration

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_items,
            create_item,
            update_item,
            delete_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 4. 🔔 Observer/Event Pattern

### Mục đích

Thông báo async từ backend đến frontend.

### Backend (Emit Event)

```rust
pub async fn process_crawl_task(
    handle: AppHandle,
    task: CrawlTask,
) -> Result<()> {
    // Process task...
    let metadata = fetch_metadata(&task.url).await?;
    update_item(task.item_id, metadata).await?;
    
    // Notify frontend
    handle.emit("item_updated", ItemUpdatedPayload {
        item_id: task.item_id,
        status: "completed",
    })?;
    
    Ok(())
}
```

### Frontend (Listen Event)

```typescript
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<ItemUpdatedPayload>('item_updated', (event) => {
    console.log('Item updated:', event.payload.item_id);
    // Refresh item data
    refetchItem(event.payload.item_id);
  });
  
  return () => {
    unlisten.then(fn => fn());
  };
}, []);
```

---

## 5. 🏗️ Builder Pattern

### Mục đích

Xây dựng complex queries một cách dễ đọc.

### Implementation

```rust
pub struct ItemQueryBuilder {
    collection_id: Option<i32>,
    search: Option<String>,
    sort_by: Option<String>,
    sort_order: SortOrder,
    offset: u64,
    limit: u64,
}

impl ItemQueryBuilder {
    pub fn new() -> Self {
        Self {
            collection_id: None,
            search: None,
            sort_by: None,
            sort_order: SortOrder::Asc,
            offset: 0,
            limit: 50,
        }
    }
    
    pub fn collection(mut self, id: i32) -> Self {
        self.collection_id = Some(id);
        self
    }
    
    pub fn search(mut self, query: &str) -> Self {
        self.search = Some(query.to_string());
        self
    }
    
    pub fn paginate(mut self, offset: u64, limit: u64) -> Self {
        self.offset = offset;
        self.limit = limit;
        self
    }
    
    pub async fn execute(self, db: &DatabaseConnection) -> Result<Vec<Item>> {
        let mut query = item::Entity::find();
        
        if let Some(id) = self.collection_id {
            query = query.filter(item::Column::CollectionId.eq(id));
        }
        
        query.offset(self.offset).limit(self.limit).all(db).await
    }
}

// Usage
let items = ItemQueryBuilder::new()
    .collection(1)
    .search("movie")
    .paginate(0, 50)
    .execute(&db)
    .await?;
```

---

## 6. 📦 Module Pattern

### Frontend (TypeScript)

```typescript
// modules/entry/index.ts - Public API
export { EntryList } from './components/EntryList';
export { EntryCard } from './components/EntryCard';
export { useEntries } from './hooks/useEntries';
export { entryService } from './services/entryService';
export type { Entry, CreateEntryDto } from './types/entry.types';

// Usage in other modules
import { EntryList, useEntries, Entry } from '@/modules/entry';
```

### Backend (Rust)

```rust
// modules/entry/mod.rs
pub mod commands;
pub mod service;
pub mod repository;
mod models;

// Re-export public API
pub use commands::*;
pub use service::ItemService;
pub use models::{Item, CreateItemDto};
```

### Benefits

- ✅ Encapsulation
- ✅ Clear dependencies
- ✅ Easy to refactor

---

## 7. 🔁 Dependency Injection

### Implementation

```rust
pub struct AppState {
    pub db: Arc<DatabaseConnection>,
    pub item_service: Arc<ItemService>,
    pub collection_service: Arc<CollectionService>,
}

impl AppState {
    pub async fn new() -> Result<Self> {
        let db = Arc::new(Database::connect("sqlite:vault.db").await?);
        
        let item_repo = Arc::new(SqliteItemRepository::new(db.clone()));
        let item_service = Arc::new(ItemService::new(item_repo));
        
        let collection_repo = Arc::new(SqliteCollectionRepository::new(db.clone()));
        let collection_service = Arc::new(CollectionService::new(collection_repo));
        
        Ok(Self {
            db,
            item_service,
            collection_service,
        })
    }
}
```

---

## 🔗 Tài liệu Liên quan

- [Kiến trúc Tổng quan](./1-overview.md)
- [Thiết kế Hệ thống](./2-system-design.md)
- [Tech Stack](./3-tech-stack.md)
- [Data Flow](./4-data-flow.md)

---

_Cập nhật: 2026-01-08_
