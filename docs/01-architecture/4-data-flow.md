# 🔄 Data Flow - Vaultrs

> **Mục tiêu:** Mô tả luồng dữ liệu trong ứng dụng Vaultrs từ UI đến Database và ngược lại.

---

## 📋 TL;DR

```
User Action → React Component → invoke() → Tauri Command → Service → Repository → SQLite
                                                                              ↓
UI Update ← React State Update ← JSON Response ← Result<T> ← SeaORM Query ←──┘
```

---

## 1. 🔍 Read Operation Flow

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        READ FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Action (Click/Scroll)                                  │
│         ↓                                                       │
│  2. React Component triggers fetch                              │
│         ↓                                                       │
│  3. invoke('get_items', { collection_id, offset, limit })       │
│         ↓                                                       │
│  ======================== IPC BOUNDARY ======================== │
│         ↓                                                       │
│  4. Tauri Command Handler                                       │
│         ↓                                                       │
│  5. ItemService.get_items()                                     │
│         ↓                                                       │
│  6. ItemRepository.find_all()                                   │
│         ↓                                                       │
│  7. SeaORM Query → SQLite                                       │
│         ↓                                                       │
│  8. Result<Vec<Item>>                                           │
│         ↓                                                       │
│  ======================== IPC BOUNDARY ======================== │
│         ↓                                                       │
│  9. JSON Serialization                                          │
│         ↓                                                       │
│  10. React State Update                                         │
│         ↓                                                       │
│  11. Virtual Scroller Re-render                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code Example

```typescript
// Frontend: hooks/useItems.ts
const fetchItems = async (collectionId: number, page: number) => {
    const items = await invoke<Item[]>("get_items", {
        collectionId,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
    });
    return items;
};
```

```rust
// Backend: commands/item_commands.rs
#[tauri::command]
async fn get_items(
    state: State<'_, AppState>,
    collection_id: i32,
    offset: u64,
    limit: u64,
) -> Result<Vec<Item>, String> {
    state.item_service
        .get_items(collection_id, offset, limit)
        .await
        .map_err(|e| e.to_string())
}
```

---

## 2. ✏️ Write Operation Flow

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WRITE FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Input (Form Submit)                                    │
│         ↓                                                       │
│  2. Client-side Validation                                      │
│         ↓                                                       │
│  3. invoke('create_item', { data })                             │
│         ↓                                                       │
│  ======================== IPC BOUNDARY ======================== │
│         ↓                                                       │
│  4. Tauri Command Handler                                       │
│         ↓                                                       │
│  5. Server-side Validation                                      │
│         ↓                                                       │
│  6. ItemService.create()                                        │
│         ↓                                                       │
│  7. ItemRepository.insert()                                     │
│         ↓                                                       │
│  8. SQLite INSERT (Transaction)                                 │
│         ↓                                                       │
│  9. Result<Item> (with new ID)                                  │
│         ↓                                                       │
│  ======================== IPC BOUNDARY ======================== │
│         ↓                                                       │
│  10. Optimistic UI Update / Invalidate Cache                    │
│         ↓                                                       │
│  11. Success Toast                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code Example

```typescript
// Frontend: services/itemService.ts
export const createItem = async (data: CreateItemDto): Promise<Item> => {
    return invoke<Item>("create_item", { data });
};
```

```rust
// Backend: services/item_service.rs
pub async fn create(&self, data: CreateItemDto) -> Result<Item> {
    // Validate
    self.validator.validate(&data)?;

    // Create entity
    let item = item::ActiveModel {
        collection_id: Set(data.collection_id),
        title: Set(data.title),
        properties: Set(data.properties),
        ..Default::default()
    };

    // Insert
    let result = item.insert(&self.db).await?;
    Ok(result)
}
```

---

## 3. 🔎 Search Flow

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SEARCH FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User types in search box                                    │
│         ↓                                                       │
│  2. Debounce (300ms)                                            │
│         ↓                                                       │
│  3. invoke('search_items', { query, collection_id })            │
│         ↓                                                       │
│  4. Service: Build FTS query                                    │
│         ↓                                                       │
│  5. SQLite FTS5 Search                                          │
│         ↓                                                       │
│  6. Ranked Results                                              │
│         ↓                                                       │
│  7. UI displays results                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Debounce Implementation

```typescript
const useSearch = (collectionId: number) => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (debouncedQuery) {
            searchItems(collectionId, debouncedQuery);
        }
    }, [debouncedQuery, collectionId]);
};
```

---

## 4. 🤖 Background Crawler Flow

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRAWLER FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User triggers "Fetch Metadata"                              │
│         ↓                                                       │
│  2. invoke('queue_crawl', { item_ids })                         │
│         ↓                                                       │
│  3. CrawlerService: Add to queue (mpsc::channel)                │
│         ↓                                                       │
│  4. Return immediately (non-blocking)                           │
│         ↓                                                       │
│  ======================== BACKGROUND ========================== │
│         ↓                                                       │
│  5. Worker picks up task                                        │
│         ↓                                                       │
│  6. HTTP Request to external API                                │
│         ↓                                                       │
│  7. Parse response                                              │
│         ↓                                                       │
│  8. Update item in database                                     │
│         ↓                                                       │
│  9. Emit event('item_updated', { item_id })                     │
│         ↓                                                       │
│  ======================== FRONTEND ============================ │
│         ↓                                                       │
│  10. Listen for event                                           │
│         ↓                                                       │
│  11. Refetch/Update UI                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 📊 Virtual Scrolling Data Flow

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              VIRTUAL SCROLLING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Items: 10,000,000                                        │
│  Visible: ~20 rows                                              │
│  Overscan: 5 rows each side                                     │
│                                                                 │
│  ┌─────┐                                                        │
│  │░░░░░│ ← Not rendered (items 0-99,970)                        │
│  ├─────┤                                                        │
│  │     │ ← Overscan buffer (5 rows)                             │
│  ├─────┤                                                        │
│  │█████│ ← Visible viewport (20 rows)                           │
│  ├─────┤                                                        │
│  │     │ ← Overscan buffer (5 rows)                             │
│  ├─────┤                                                        │
│  │░░░░░│ ← Not rendered (remaining)                             │
│  └─────┘                                                        │
│                                                                 │
│  On Scroll:                                                     │
│  1. Calculate new visible range                                 │
│  2. Recycle DOM nodes                                           │
│  3. Fetch data if needed (pagination)                           │
│  4. Update positions (transforms)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 🔒 Error Flow

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Error occurs in Backend                                        │
│         ↓                                                       │
│  Convert to VaultError enum                                     │
│         ↓                                                       │
│  Serialize as JSON { error: "message", code: "ERROR_CODE" }     │
│         ↓                                                       │
│  ======================== IPC BOUNDARY ======================== │
│         ↓                                                       │
│  Frontend receives Err variant                                  │
│         ↓                                                       │
│  Map to user-friendly message                                   │
│         ↓                                                       │
│  Display Toast / Error Boundary                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Tài liệu Liên quan

-   [Kiến trúc Tổng quan](./1-overview.md)
-   [Thiết kế Hệ thống](./2-system-design.md)
-   [Tech Stack](./3-tech-stack.md)
-   [Design Patterns](./5-design-patterns.md)

---

_Cập nhật: 2026-01-08_
