# 🔧 Thiết kế Hệ thống - Vaultrs

> **Mục tiêu:** Mô tả chi tiết thiết kế hệ thống Vaultrs, bao gồm các components, modules, và cách chúng tương tác với nhau.

---

## 📋 TL;DR

```
┌─────────────────────────────────────────────────────────────┐
│                     VAULTRS SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend: React + Shadcn UI + TanStack Virtual             │
│  Backend: Rust + Tauri + Tokio                              │
│  Database: SQLite + SeaORM                                  │
│  Pattern: Modular Monolith + Repository + Service Layer     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 🏗️ System Components

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        VAULTRS APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │   UI     │  │  State   │  │  Hooks   │  │ Services │   │  │
│  │  │Components│  │ Manager  │  │          │  │ (API)    │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↕ IPC                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     BACKEND                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ Commands │  │ Services │  │  Repos   │  │ Workers  │   │  │
│  │  │ (Tauri)  │  │          │  │          │  │ (Async)  │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↕ ORM                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    DATABASE                               │  │
│  │  ┌───────────────────────────────────────────────────┐    │  │
│  │  │          SQLite (WAL Mode)                        │    │  │
│  │  │  Collections │ Items │ Attributes │ Settings      │    │  │
│  │  └───────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 📦 Frontend Architecture

### Component Hierarchy

```
App.tsx
├── ThemeProvider
│   └── RouterProvider
│       ├── MainLayout
│       │   ├── Header
│       │   ├── Sidebar
│       │   └── MainContent
│       │       ├── HomePage
│       │       ├── VaultPage
│       │       │   ├── CollectionList
│       │       │   └── ItemGrid
│       │       │       └── VirtualTable
│       │       └── SettingsPage
│       └── AuthGuard (nếu có)
```

### Module Structure

```
src/
├── core/                    # 🔧 Shared Utilities
│   ├── api/                 # Tauri invoke wrappers
│   │   ├── index.ts
│   │   └── tauri.ts
│   ├── hooks/               # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── types/               # Global TypeScript types
│   │   └── common.ts
│   └── utils/               # Helper functions
│       ├── validation.ts
│       └── formatting.ts
│
├── components/              # 🧩 Shared UI Components
│   ├── ui/                  # Shadcn base components
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── Layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
│
├── modules/                 # 📦 Feature Modules
│   ├── vault/               # Collection management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── entry/               # Item management
│   │   ├── components/
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   ├── EntryForm.tsx
│   │   │   └── VirtualTable.tsx
│   │   ├── hooks/
│   │   │   ├── useEntries.ts
│   │   │   └── useSearch.ts
│   │   ├── services/
│   │   │   └── entryService.ts
│   │   └── types/
│   │       └── entry.types.ts
│   └── crawler/             # Metadata fetcher UI
│
├── pages/                   # 📄 Route Pages
│   ├── HomePage.tsx
│   ├── VaultPage.tsx
│   └── SettingsPage.tsx
│
└── router/                  # 🔀 Routing
    └── index.tsx
```

### State Management Strategy

```typescript
// 1. Local State - Component-specific
const [isOpen, setIsOpen] = useState(false);

// 2. Context - Shared across module
const VaultContext = createContext<VaultState>(null);

// 3. URL State - Shareable, bookmarkable
const [searchParams, setSearchParams] = useSearchParams();

// 4. Server State - TanStack Query (nếu cần)
const { data, isLoading } = useQuery({
    queryKey: ['entries', collectionId],
    queryFn: () => entryService.getAll(collectionId),
});
```

---

## 3. 🦀 Backend Architecture

### Module Structure

```
src-tauri/src/
├── main.rs                  # Entry point
├── lib.rs                   # Module registration
│
├── core/                    # 🔧 Core Utilities
│   ├── mod.rs
│   ├── error.rs             # Custom error types
│   ├── result.rs            # Result type aliases
│   └── config.rs            # App configuration
│
├── db/                      # 💾 Database
│   ├── mod.rs
│   ├── connection.rs        # Database connection
│   └── migrations/          # Schema migrations
│
├── models/                  # 📊 Data Models
│   ├── mod.rs
│   ├── collection.rs        # Collection entity
│   ├── item.rs              # Item entity
│   └── attribute.rs         # Attribute entity
│
├── repositories/            # 📦 Data Access
│   ├── mod.rs
│   ├── collection_repo.rs
│   └── item_repo.rs
│
├── services/                # ⚙️ Business Logic
│   ├── mod.rs
│   ├── collection_service.rs
│   ├── item_service.rs
│   └── crawler_service.rs
│
└── commands/                # 🎮 Tauri Commands
    ├── mod.rs
    ├── collection_commands.rs
    ├── item_commands.rs
    └── crawler_commands.rs
```

### Layer Responsibilities

```
┌──────────────────────────────────────────────────────────────┐
│                    COMMANDS LAYER                            │
│  - Entry point từ frontend                                   │
│  - Request/Response serialization                            │
│  - Error handling và conversion                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                            │
│  - Business logic                                            │
│  - Validation rules                                          │
│  - Orchestration của repositories                            │
│  - Background task management                                │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                   REPOSITORIES LAYER                         │
│  - CRUD operations                                           │
│  - Query building                                            │
│  - Database abstraction                                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                     MODELS LAYER                             │
│  - Entity definitions                                        │
│  - DTOs (Data Transfer Objects)                              │
│  - SeaORM entities                                           │
└──────────────────────────────────────────────────────────────┘
```

### Application State

```rust
// src-tauri/src/main.rs

pub struct AppState {
    pub db: Arc<DatabaseConnection>,
    pub collection_service: Arc<CollectionService>,
    pub item_service: Arc<ItemService>,
    pub crawler_service: Arc<CrawlerService>,
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            collection_commands::get_collections,
            collection_commands::create_collection,
            item_commands::get_items,
            item_commands::create_item,
            // ...
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 4. 💾 Database Design

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   Collections   │       │   Attributes    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │
│ name            │   │   │ collection_id   │──┐
│ description     │   │   │ name            │  │
│ icon            │   │   │ type            │  │
│ created_at      │   │   │ is_required     │  │
│ updated_at      │   │   │ default_value   │  │
└─────────────────┘   │   └─────────────────┘  │
                      │                        │
                      │   ┌─────────────────┐  │
                      └──►│     Items       │◄─┘
                          ├─────────────────┤
                          │ id (PK)         │
                          │ collection_id   │
                          │ title           │
                          │ properties      │ (JSON)
                          │ created_at      │
                          │ updated_at      │
                          └─────────────────┘
```

### Key Design Decisions

1. **Dynamic Schema (EAV + JSON)**
   - `properties` column stores JSON cho flexibility
   - Core fields indexed cho performance
   - Attributes table định nghĩa schema per collection

2. **SQLite WAL Mode**
   - Concurrent reads during writes
   - Better crash recovery
   - Faster for read-heavy workloads

---

## 5. 🔄 Background Processing

### Crawler Worker Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    CRAWLER SERVICE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│   │   Task      │    │   Worker    │    │   Worker    │      │
│   │   Queue     │───►│     #1      │    │     #2      │      │
│   │  (mpsc)     │    │             │    │             │      │
│   └─────────────┘    └─────────────┘    └─────────────┘      │
│                              │                │              │
│                              ▼                ▼              │
│                       ┌─────────────────────────────┐        │
│                       │       HTTP Client           │        │
│                       │      (Reqwest)              │        │
│                       └─────────────────────────────┘        │
│                                    │                         │
│                                    ▼                         │
│                       ┌─────────────────────────────┐        │
│                       │    External APIs            │        │
│                       │   (TMDB, OpenLibrary, etc)  │        │
│                       └─────────────────────────────┘        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Task Processing Flow

```rust
// Simplified crawl flow
async fn process_crawl_task(task: CrawlTask, db: &DatabaseConnection) {
    // 1. Fetch metadata from external API
    let metadata = http_client.fetch(&task.url).await?;
    
    // 2. Parse and transform data
    let parsed = parser.parse(metadata)?;
    
    // 3. Update item in database
    item_repo.update_properties(task.item_id, parsed).await?;
    
    // 4. Notify frontend (optional)
    emit_event("item_updated", task.item_id);
}
```

---

## 6. 🔒 Security Considerations

### Local-First Security

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY MODEL                            │
├─────────────────────────────────────────────────────────────┤
│  ✅ All data stored locally                                 │
│  ✅ No cloud sync by default                                │
│  ✅ Process isolation (Tauri)                               │
│  ✅ IPC validation                                          │
│  ⚠️  No encryption at rest (planned)                        │
└─────────────────────────────────────────────────────────────┘
```

### Tauri Security Features

- **Process Isolation**: WebView và Rust process tách biệt
- **IPC Validation**: Type-safe commands
- **API Allowlist**: Chỉ expose các APIs cần thiết
- **Content Security Policy**: Prevent XSS

---

## 7. 📈 Performance Design

### Virtual Scrolling Implementation

```typescript
// Only render visible rows
const virtualizer = useVirtualizer({
    count: totalItems,        // Could be 10M+
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,              // Buffer rows
});

// Render chỉ ~50 rows thay vì 10M
const virtualRows = virtualizer.getVirtualItems();
```

### Pagination Strategy

```rust
// Backend pagination
pub async fn get_items(
    collection_id: i32,
    offset: u64,
    limit: u64,
) -> Result<Vec<Item>> {
    Item::find()
        .filter(item::Column::CollectionId.eq(collection_id))
        .offset(offset)
        .limit(limit)
        .all(&db)
        .await
}
```

### Query Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_items_collection ON items(collection_id);
CREATE INDEX idx_items_title ON items(title);
CREATE INDEX idx_items_created ON items(created_at);

-- Full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(title, content);
```

---

## 8. 🧪 Testing Strategy

### Test Levels

```
┌─────────────────────────────────────────────────────────────┐
│                      E2E TESTS                              │
│             (Playwright - UI flows)                         │
├─────────────────────────────────────────────────────────────┤
│                   INTEGRATION TESTS                         │
│        (Tauri commands with real database)                  │
├─────────────────────────────────────────────────────────────┤
│                      UNIT TESTS                             │
│    Frontend: Vitest      │      Backend: cargo test         │
└─────────────────────────────────────────────────────────────┘
```

### Test File Structure

```
// Frontend
src/modules/entry/__tests__/
├── EntryList.test.tsx
├── useEntries.test.ts
└── entryService.test.ts

// Backend
src-tauri/src/services/
├── item_service.rs
└── item_service_test.rs
```

---

## 🔗 Tài liệu Liên quan

- [Kiến trúc Tổng quan](./1-overview.md)
- [Tech Stack](./3-tech-stack.md)
- [Data Flow](./4-data-flow.md)
- [Design Patterns](./5-design-patterns.md)
- [Database Schema](../02-database/)

---

_Cập nhật: 2026-01-08_
