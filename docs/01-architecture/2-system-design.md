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
│       │       │   └── ItemViewer
│       │       │       ├── ViewModeToggle
│       │       │       ├── LoadingStrategySelector
│       │       │       ├── VirtualList
│       │       │       └── VirtualGrid
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
│   │   │   ├── EntryList.tsx          # Wrapper cho danh sách dạng bảng (List view)
│   │   │   ├── EntryGrid.tsx          # Wrapper cho danh sách dạng thẻ (Grid view)
│   │   │   ├── EntryCard.tsx          # Thẻ hiển thị Item (dùng trong Grid)
│   │   │   ├── EntryRow.tsx           # Hàng hiển thị Item (dùng trong List)
│   │   │   ├── VirtualList.tsx        # Render danh sách ảo hóa dạng bảng
│   │   │   ├── VirtualGrid.tsx        # Render danh sách ảo hóa dạng lưới
│   │   │   ├── ViewModeToggle.tsx     # Bộ nút chuyển đổi List/Grid
│   │   │   └── LoadingControls.tsx    # Nút phân trang hoặc phần tử trigger Infinite Scroll
│   │   ├── hooks/
│   │   │   ├── useEntries.ts          # State/IPC hook hỗ trợ cả hai chiến lược load dữ liệu
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
    queryKey: ["entries", collectionId],
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

## 5. 🖼️ Image Storage Architecture

### File Storage Structure

```
<app_data_dir>/
└── images/
    ├── 1/                      # Collection ID
    │   ├── 1.jpg              # Item ID.extension
    │   ├── 2.png
    │   ├── 3.webp
    │   └── ...
    ├── 2/
    │   ├── 1.jpg
    │   └── ...
    └── ...
```

### Image Storage Design

```
┌──────────────────────────────────────────────────────────────┐
│                   IMAGE STORAGE MODULE                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐    │
│   │            ImageStorage                             │    │
│   ├─────────────────────────────────────────────────────┤    │
│   │ - save_local_image()                                │    │
│   │ - download_and_save_image()                         │    │
│   │ - delete_image()                                    │    │
│   │ - get_full_path()                                   │    │
│   │ - image_exists()                                    │    │
│   └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│   ┌─────────────────────────────────────────────────────┐    │
│   │         ImageProcessor                              │    │
│   ├─────────────────────────────────────────────────────┤    │
│   │ - generate_thumbnail()                              │    │
│   │ - resize_image()                                    │    │
│   │ - encode_jpeg()                                     │    │
│   │ - to_base64()                                       │    │
│   │ - to_data_url()                                     │    │
│   └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│   ┌─────────────────────────────────────────────────────┐    │
│   │         EntryImageService                           │    │
│   ├─────────────────────────────────────────────────────┤    │
│   │ - set_cover_from_file()                             │    │
│   │ - set_cover_from_url()                              │    │
│   │ - remove_cover()                                    │    │
│   │ - get_thumbnail()                                   │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **File System Storage**

    - Images stored in file system, not in database
    - Database only stores relative paths
    - Reduces database size and improves performance
    - Easier to manage large binary files

2. **Organized by Collection and Item**

    - Directory structure: `images/<collection_id>/<item_id>.<ext>`
    - One image per item (cover image only)
    - Easy cleanup when collection/item is deleted
    - Prevents ID collisions across collections

3. **Supported Formats**

    - JPEG, PNG, WebP, GIF
    - Format detection via image metadata
    - File extension determined by image format
    - Old images deleted when new image is uploaded

4. **Image Sources**
    - Local file upload: File copied to app data directory
    - URL reference: URL stored directly in database (not downloaded)
    - Helps reduce storage for external images

### Image Processing Pipeline

```rust
// Upload from local file
[User selects file]
      ↓
[Validate file size (max 10MB)]
      ↓
[Detect image format]
      ↓
[Copy to: images/<collection_id>/<item_id>.<ext>]
      ↓
[Update item.cover_image_path in DB]
      ↓
[Delete old image if exists]

// Set from URL
[User provides URL]
      ↓
[Validate URL format]
      ↓
[Store URL in item.cover_image_path]
      ↓
[Delete old local image if exists]

// Generate thumbnail
[Request thumbnail for item]
      ↓
[Load image from disk]
      ↓
[Resize to 300x300 (maintain aspect ratio)]
      ↓
[Encode as JPEG (quality: 85)]
      ↓
[Return as base64 data URL]
```

### Image Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                      IMAGE LIFECYCLE                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. UPLOAD                                                   │
│     ┌────────────────────────────────────────────┐            │
│     │ - User uploads image                       │            │
│     │ - Validate size and format                 │            │
│     │ - Save to file system                      │            │
│     │ - Store path in database                   │            │
│     └────────────────────────────────────────────┘            │
│                                                              │
│  2. USE                                                      │
│     ┌────────────────────────────────────────────┐            │
│     │ - Display in UI (lazy loading)             │            │
│     │ - Generate thumbnails on demand            │            │
│     │ - Cache thumbnails in memory               │            │
│     └────────────────────────────────────────────┘            │
│                                                              │
│  3. UPDATE                                                   │
│     ┌────────────────────────────────────────────┐            │
│     │ - Upload new image                         │            │
│     │ - Delete old image file                    │            │
│     │ - Update database path                     │            │
│     └────────────────────────────────────────────┘            │
│                                                              │
│  4. DELETE                                                   │
│     ┌────────────────────────────────────────────┐            │
│     │ - Entry deleted → delete image file        │            │
│     │ - Collection deleted → delete entire dir   │            │
│     │ - Orphan cleanup utility available         │            │
│     └────────────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Performance Optimizations

```typescript
// Frontend: Lazy loading thumbnails
const { data: thumbnail } = useQuery({
    queryKey: ["thumbnail", itemId],
    queryFn: () => api.getItemThumbnail(itemId),
    enabled: isInViewport, // Only load when visible
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});

// Virtual scrolling with image loading
const virtualizer = useVirtualizer({
    count: entries.length,
    overscan: 5, // Preload nearby images
});
```

### Storage Constraints

-   **Max file size:** 10MB per image
-   **Max dimensions:** No hard limit (resized for thumbnails)
-   **Thumbnail size:** 300x300 pixels (maintains aspect ratio)
-   **JPEG quality:** 85 for thumbnails
-   **Supported formats:** JPEG, PNG, WebP, GIF

---

## 6. 🔄 Background Processing

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

## 7. 🔒 Security Considerations

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

-   **Process Isolation**: WebView và Rust process tách biệt
-   **IPC Validation**: Type-safe commands
-   **API Allowlist**: Chỉ expose các APIs cần thiết
-   **Content Security Policy**: Prevent XSS

---

## 8. 📈 Performance & UI Strategies

### 8.1 Rendering Strategy: Virtualization (Luôn bật)

Để đảm bảo hiệu năng tối ưu trên quy mô dữ liệu cực lớn (**10M+ records**), kỹ thuật **Virtualization** (phân trang ảo/cuộn ảo) thông qua thư viện `TanStack Virtual` được bắt buộc áp dụng và luôn ở trạng thái hoạt động cho cả hai chế độ hiển thị:

#### A. Virtualization trong List Mode (Dạng bảng)
Cuộn ảo 1 chiều (dọc) với chiều cao mỗi hàng cố định hoặc dynamic.
```typescript
const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Chiều cao ước lượng của một hàng bảng
    overscan: 5,
});
```

#### B. Virtualization trong Grid Mode (Dạng lưới)
Cuộn ảo đa cột. Ổn định số lượng cột dựa trên chiều rộng viewport, sau đó tính toán số hàng ảo cần hiển thị.
```typescript
const colCount = Math.floor(viewportWidth / CARD_WIDTH);
const rowCount = Math.ceil(items.length / colCount);

const gridVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT, // Chiều cao ước lượng của một hàng thẻ
    overscan: 3,
});
```

---

### 8.2 View Mode: List | Grid

Hệ thống hỗ trợ chuyển đổi linh hoạt giữa hai chế độ hiển thị tùy theo nhu cầu xem của người dùng:

-   **List Mode (Dạng bảng):**
    -   Hiển thị thông tin dưới dạng dòng và cột (Title, Created At, Updated At, các trường dữ liệu tùy chỉnh).
    -   Tối ưu cho việc so sánh, sắp xếp nhanh nhiều trường thông tin và thực hiện các thao tác hàng loạt.
-   **Grid Mode (Dạng lưới):**
    -   Hiển thị thông tin dưới dạng các thẻ (Card) trực quan với ảnh bìa nổi bật (Cover Image).
    -   Phù hợp cho các bộ sưu tập media, sách, hoặc hình ảnh yêu cầu trải nghiệm duyệt trực quan.

---

### 8.3 Loading Strategy: Pagination | Infinite Scroll

Để giảm thiểu tải dữ liệu từ SQLite DB và tối ưu bộ nhớ heap của React, Vaultrs hỗ trợ cấu hình hai chiến lược tải dữ liệu:

#### A. Chiến lược phân trang truyền thống (Pagination)
-   Dữ liệu được tải theo từng trang cố định (ví dụ: 50 items/trang).
-   Sử dụng các nút điều khiển Trang trước, Trang sau, Chọn trang.
-   **Luồng IPC / SQL Backend:**
    ```rust
    // Sử dụng limit và offset để lấy dữ liệu đúng trang
    pub async fn get_items_paginated(
        collection_id: i32,
        page: u64,
        limit: u64,
    ) -> Result<Vec<Item>> {
        let offset = (page - 1) * limit;
        Item::find()
            .filter(item::Column::CollectionId.eq(collection_id))
            .offset(offset)
            .limit(limit)
            .all(&db)
            .await
    }
    ```

#### B. Chiến lược cuộn vô tận (Infinite Scroll)
-   Tự động tải thêm dữ liệu khi người dùng cuộn đến gần cuối danh sách hiện tại.
-   Sử dụng một phần tử trigger (Intersection Observer) hoặc tích hợp trực tiếp vào sự kiện scroll của container cuộn ảo để gọi IPC tải trang tiếp theo và nối vào mảng dữ liệu hiện có (`prev => [...prev, ...newItems]`).
-   **Luồng IPC / SQL Backend (Khuyến nghị dùng Keyset Pagination để tránh suy giảm hiệu năng ở offset lớn):**
    ```rust
    // Keyset pagination: Lọc theo ID lớn hơn ID cuối cùng của trang trước
    pub async fn get_items_infinite(
        collection_id: i32,
        last_id: i32,
        limit: u64,
    ) -> Result<Vec<Item>> {
        Item::find()
            .filter(item::Column::CollectionId.eq(collection_id))
            .filter(item::Column::Id.gt(last_id))
            .order_by_asc(item::Column::Id)
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

## 9. 🧪 Testing Strategy

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

-   [Kiến trúc Tổng quan](./1-overview.md)
-   [Tech Stack](./3-tech-stack.md)
-   [Database Schema](../02-database/)

---

_Cập nhật: 2026-07-16_
