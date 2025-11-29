# Architecture Overview

> **⚠️ Note:** This document describes the **planned architecture** for Vaultrs. The project is currently in the design phase with no implementation yet.

---

## Table of Contents

-   [Project Status](#project-status)
-   [System Architecture](#system-architecture)
-   [Technology Stack](#technology-stack)
-   [Design Patterns](#design-patterns)
-   [Data Flow](#data-flow)
-   [Module Structure](#module-structure)
-   [Key Components](#key-components)
-   [Design Decisions](#design-decisions)

---

## Project Status

**Current Phase:** Planning & Design  
**Implementation:** Not started  
**Purpose:** Personal learning project

This architecture document serves as:

-   A blueprint for future development
-   A learning exercise in system design
-   A reference for understanding the planned approach

---

## System Architecture

The planned architecture follows a **Modular Monolith** pattern - all components in a single deployable unit with clear module boundaries.

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React + TypeScript + Vite                             │ │
│  │  • Shadcn UI Components                                │ │
│  │  • TanStack Table (Data Grid Logic)                    │ │
│  │  • TanStack Virtual (10M Row Rendering)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ IPC (Tauri Commands)
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                          │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │  Item Service       │  │  Crawler Service             │  │
│  │  • CRUD Operations  │  │  • Background Workers        │  │
│  │  • Validation       │  │  • Tokio Async Runtime       │  │
│  │  • Business Logic   │  │  • HTTP Client (Reqwest)     │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SeaORM
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SQLite (WAL Mode)                                     │ │
│  │  • Embedded Database (No Server Required)              │ │
│  │  • Collections, Attributes, Items Tables               │ │
│  │  • JSON Properties for Dynamic Schema                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Planned)

| Technology           | Purpose           | Why Chosen                             |
| -------------------- | ----------------- | -------------------------------------- |
| **React 18**         | UI Framework      | Component reusability, large ecosystem |
| **TypeScript**       | Type Safety       | Catch errors at compile time           |
| **Vite**             | Build Tool        | Lightning-fast HMR, optimized builds   |
| **Shadcn UI**        | Component Library | Customizable, accessible, modern       |
| **Tailwind CSS**     | Styling           | Utility-first, highly optimized        |
| **TanStack Table**   | Grid Logic        | Powerful, headless table management    |
| **TanStack Virtual** | Virtualization    | Handle millions of rows efficiently    |

### Backend (Planned)

| Technology   | Purpose           | Why Chosen                               |
| ------------ | ----------------- | ---------------------------------------- |
| **Rust**     | System Language   | Memory safety, performance, concurrency  |
| **Tauri v2** | Desktop Framework | Small binary size, security, native APIs |
| **Tokio**    | Async Runtime     | Non-blocking I/O, efficient concurrency  |
| **SeaORM**   | ORM               | Type-safe, async-first, modern           |
| **SQLite**   | Database          | Embedded, zero-config, fast for reads    |
| **Reqwest**  | HTTP Client       | Async, feature-rich, well-maintained     |

---

## Design Patterns

### 1. Repository Pattern (Planned)

All database access will be abstracted through repository interfaces:

```rust
// Planned interface
pub trait ItemRepository {
    async fn find_by_id(&self, id: i32) -> Result<Option<Item>>;
    async fn find_all(&self, params: QueryParams) -> Result<Vec<Item>>;
    async fn create(&self, item: CreateItem) -> Result<Item>;
    async fn update(&self, id: i32, item: UpdateItem) -> Result<Item>;
    async fn delete(&self, id: i32) -> Result<()>;
}
```

**Benefits:**

-   Testability (can mock repositories)
-   Flexibility (can swap database implementations)
-   Separation of concerns

### 2. Service Layer Pattern (Planned)

Business logic will be encapsulated in service structs:

```rust
// Planned structure
pub struct ItemService {
    repository: Arc<dyn ItemRepository>,
    validator: Arc<Validator>,
}

impl ItemService {
    pub async fn create_item(&self, data: CreateItemDto) -> Result<Item> {
        self.validator.validate(&data)?;
        let item = self.repository.create(data.into()).await?;
        Ok(item)
    }
}
```

### 3. Command Pattern (Planned)

Frontend will communicate with backend via Tauri commands:

```rust
// Planned command structure
#[tauri::command]
async fn get_items(
    state: State<'_, AppState>,
    params: GetItemsParams,
) -> Result<Vec<Item>, String> {
    state.item_service
        .get_items(params)
        .await
        .map_err(|e| e.to_string())
}
```

### 4. Background Worker Pattern (Planned)

Long-running tasks will execute in background:

```rust
// Planned worker structure
pub struct CrawlerService {
    tx: mpsc::Sender<CrawlTask>,
}

impl CrawlerService {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        let (tx, mut rx) = mpsc::channel(100);

        tokio::spawn(async move {
            while let Some(task) = rx.recv().await {
                process_task(task, &db).await;
            }
        });

        Self { tx }
    }
}
```

---

## Data Flow

### Planned Read Operation Flow

```
User Action (Click/Scroll)
    ↓
React Component
    ↓
invoke('get_items', { limit, offset })
    ↓
Tauri Command Handler
    ↓
ItemService.get_items()
    ↓
ItemRepository.find_all()
    ↓
SeaORM Query
    ↓
SQLite Database
    ↓
[Result<Vec<Item>>]
    ↓
JSON Serialization
    ↓
IPC Response
    ↓
React State Update
    ↓
Virtual Scroller Re-render
```

### Planned Write Operation Flow

```
User Input
    ↓
Form Submit
    ↓
invoke('create_item', { data })
    ↓
Validation
    ↓
ItemService.create()
    ↓
ItemRepository.insert()
    ↓
SQLite Transaction
    ↓
Success Response
    ↓
UI Update
```

---

## Module Structure

### Planned Frontend Structure

```
src-ui/src/
├── components/
│   ├── ui/                    # Shadcn base components
│   ├── DataGrid.tsx           # Main grid component
│   ├── VirtualTable.tsx       # Virtual scrolling wrapper
│   └── CollectionManager.tsx  # Collection CRUD
├── hooks/
│   ├── useItems.ts            # Item data fetching
│   └── useCrawler.ts          # Crawler control
├── lib/
│   ├── tauri.ts               # Tauri API wrappers
│   └── utils.ts               # Helper functions
├── types/
│   └── index.ts               # TypeScript definitions
└── App.tsx
```

### Planned Backend Structure

```
src-tauri/src/
├── commands/                  # Tauri command handlers
│   ├── items.rs
│   ├── collections.rs
│   └── crawler.rs
├── services/                  # Business logic
│   ├── item_service.rs
│   └── crawler_service.rs
├── repositories/              # Data access
│   └── item_repository.rs
├── models/                    # Database entities
│   ├── collections.rs
│   ├── attributes.rs
│   └── items.rs
├── db/                        # Database utilities
│   ├── connection.rs
│   └── migrations/
└── main.rs
```

---

## Key Components

### 1. Virtual Scroller (Planned)

Will handle efficient rendering of millions of rows:

```typescript
// Planned implementation
const virtualizer = useVirtualizer({
    count: items.length, // Total items
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 10, // Extra rows for smoothness
});
```

**How it will work:**

-   Render only visible rows + overscan buffer
-   Reuse DOM nodes as user scrolls
-   Maintain constant memory usage

### 2. Background Crawler (Planned)

Async task queue with Tokio:

```rust
// Planned implementation
pub struct CrawlerService {
    tx: mpsc::Sender<CrawlTask>,
    active_workers: Arc<AtomicUsize>,
}
```

**Features:**

-   Non-blocking metadata fetching
-   Rate limiting
-   Error handling and retries

### 3. Dynamic Schema (Planned)

Hybrid EAV + JSON approach:

```rust
// Planned structure
pub struct Item {
    pub id: i32,
    pub collection_id: i32,
    pub title: String,           // Indexed for search
    pub created_at: i64,         // Indexed for sorting
    pub properties: String,      // JSON blob for flexibility
}
```

---

## Design Decisions

### Why SQLite over PostgreSQL?

| Consideration        | SQLite                 | PostgreSQL                 |
| -------------------- | ---------------------- | -------------------------- |
| **Setup**            | ✅ Zero config         | ❌ Requires server         |
| **Distribution**     | ✅ Single file         | ❌ Separate install        |
| **Read Performance** | ✅ Excellent (local)   | ⚠️ Good (network overhead) |
| **Use Case**         | ✅ Single-user desktop | ❌ Multi-user server       |

**Decision:** SQLite is perfect for a single-user desktop app.

### Why Tauri over Electron?

| Consideration   | Tauri                | Electron          |
| --------------- | -------------------- | ----------------- |
| **Binary Size** | ✅ ~8MB              | ❌ ~150MB         |
| **Memory**      | ✅ ~50MB             | ❌ ~200MB+        |
| **Security**    | ✅ Process isolation | ⚠️ Node.js access |
| **Learning**    | 📚 Rust experience   | 📚 JavaScript     |

**Decision:** Tauri for learning Rust and better performance.

### Why EAV + JSON Schema?

**Alternatives Considered:**

1. Pure Relational - Too rigid for custom fields
2. Pure JSON - Can't index/search efficiently
3. **EAV + JSON** - ✅ Best of both worlds

**Benefits:**

-   Flexible schema changes
-   Fast queries on indexed fields
-   JSON for custom attributes

---

## Performance Targets

| Operation               | Target | Strategy          |
| ----------------------- | ------ | ----------------- |
| Initial Load (100 rows) | <500ms | Indexed queries   |
| Scroll Frame Rate       | 60 FPS | Virtual scrolling |
| Search (indexed)        | <100ms | SQLite FTS        |
| Insert (single)         | <10ms  | Optimized writes  |

---

## Scalability Considerations

### Planned Limits

| Resource                | Target Limit | Reason                      |
| ----------------------- | ------------ | --------------------------- |
| **Max Items**           | 10M+         | Design goal                 |
| **Max Collections**     | 10K          | Reasonable for personal use |
| **Concurrent Crawlers** | 10           | Rate limiting / CPU         |
| **UI Performance**      | Infinite\*   | Virtual scrolling           |

\*Technically limited by JavaScript number safety (2^53)

---

## Future Considerations

### Potential Enhancements

1. **Plugin System** - Load custom crawlers dynamically
2. **Cloud Sync** - Optional backup to cloud storage
3. **Multi-Collection Views** - Virtual collections from queries
4. **GraphQL API** - Expose data to external tools

---

## Learning Objectives

This architecture serves as a learning exercise in:

-   ✅ System design at scale
-   ✅ Database optimization techniques
-   ✅ Async programming patterns
-   ✅ Desktop application architecture
-   ✅ Performance optimization strategies

---

## Related Documentation

-   [Database Schema](DATABASE.md) - Detailed database design
-   [API Reference](API.md) - Planned command structure
-   [Performance Guide](PERFORMANCE.md) - Optimization strategies
-   [Development Notes](../CONTRIBUTING.md) - Learning objectives

---

**Status:** Design Phase  
**Last Updated:** 2024-11-29  
**Next Step:** Begin implementation planning
