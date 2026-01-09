# 🎮 Tauri Commands - Vaultrs

> **Mục tiêu:** Hướng dẫn cách tạo và sử dụng Tauri commands để giao tiếp giữa frontend và backend.

---

## 📋 TL;DR

| Concept        | Description                              |
| -------------- | ---------------------------------------- |
| `#[tauri::command]` | Macro đánh dấu function là command  |
| `invoke()`     | Frontend gọi command                     |
| `State<>`      | Access managed state                     |
| `Result<T, E>` | Return success hoặc error                |

---

## 1. 📖 Command Basics

### Anatomy of a Command

```rust
use tauri::State;
use crate::AppState;

#[tauri::command]
async fn command_name(
    state: State<'_, AppState>,  // Managed state
    param1: String,               // Parameter from frontend
    param2: i32,                  // Another parameter
) -> Result<ReturnType, String> { // Return type
    // Implementation
    Ok(result)
}
```

### Simple Command Example

```rust
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
```

### Frontend Call

```typescript
import { invoke } from '@tauri-apps/api/core';

const greeting = await invoke<string>('greet', { name: 'User' });
```

---

## 2. 📦 Command Organization

### File Structure

```
src/commands/
├── mod.rs                    # Re-exports all commands
├── collection_commands.rs    # Collection CRUD
├── item_commands.rs          # Item CRUD
└── crawler_commands.rs       # Crawler control
```

### mod.rs

```rust
// src/commands/mod.rs
mod collection_commands;
mod item_commands;
mod crawler_commands;

pub use collection_commands::*;
pub use item_commands::*;
pub use crawler_commands::*;
```

### Registration in lib.rs

```rust
.invoke_handler(tauri::generate_handler![
    commands::get_collections,
    commands::create_collection,
    commands::update_collection,
    commands::delete_collection,
    commands::get_items,
    commands::create_item,
    commands::update_item,
    commands::delete_item,
])
```

---

## 3. 📋 Collection Commands

### collection_commands.rs

```rust
// src/commands/collection_commands.rs
use tauri::State;
use crate::{AppState, models::Collection, services::CollectionService};

#[tauri::command]
pub async fn get_collections(
    state: State<'_, AppState>,
) -> Result<Vec<Collection>, String> {
    CollectionService::get_all(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collection(
    state: State<'_, AppState>,
    id: i32,
) -> Result<Option<Collection>, String> {
    CollectionService::get_by_id(&state.db, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_collection(
    state: State<'_, AppState>,
    name: String,
    slug: String,
    icon: Option<String>,
    description: Option<String>,
) -> Result<Collection, String> {
    CollectionService::create(&state.db, name, slug, icon, description)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_collection(
    state: State<'_, AppState>,
    id: i32,
    name: Option<String>,
    icon: Option<String>,
    description: Option<String>,
) -> Result<Collection, String> {
    CollectionService::update(&state.db, id, name, icon, description)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_collection(
    state: State<'_, AppState>,
    id: i32,
) -> Result<(), String> {
    CollectionService::delete(&state.db, id)
        .await
        .map_err(|e| e.to_string())
}
```

---

## 4. 📝 Item Commands

### item_commands.rs

```rust
// src/commands/item_commands.rs
use tauri::State;
use serde_json::Value as JsonValue;
use crate::{AppState, models::Item, services::ItemService};

#[derive(serde::Deserialize)]
pub struct GetItemsParams {
    pub collection_id: i32,
    pub offset: Option<u64>,
    pub limit: Option<u64>,
    pub search: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct CreateItemParams {
    pub collection_id: i32,
    pub title: String,
    pub properties: Option<JsonValue>,
}

#[tauri::command]
pub async fn get_items(
    state: State<'_, AppState>,
    params: GetItemsParams,
) -> Result<Vec<Item>, String> {
    ItemService::get_items(
        &state.db,
        params.collection_id,
        params.offset.unwrap_or(0),
        params.limit.unwrap_or(100),
        params.search,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_item(
    state: State<'_, AppState>,
    id: i32,
) -> Result<Option<Item>, String> {
    ItemService::get_by_id(&state.db, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_item(
    state: State<'_, AppState>,
    params: CreateItemParams,
) -> Result<Item, String> {
    ItemService::create(
        &state.db,
        params.collection_id,
        params.title,
        params.properties,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_item(
    state: State<'_, AppState>,
    id: i32,
    title: Option<String>,
    properties: Option<JsonValue>,
) -> Result<Item, String> {
    ItemService::update(&state.db, id, title, properties)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_item(
    state: State<'_, AppState>,
    id: i32,
) -> Result<(), String> {
    ItemService::delete(&state.db, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_items_count(
    state: State<'_, AppState>,
    collection_id: i32,
) -> Result<u64, String> {
    ItemService::count(&state.db, collection_id)
        .await
        .map_err(|e| e.to_string())
}
```

---

## 5. 🌐 Frontend Integration

### TypeScript Types

```typescript
// src/types/api.types.ts
export interface Collection {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at: number;
  updated_at: number;
}

export interface Item {
  id: number;
  collection_id: number;
  title: string;
  properties: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface GetItemsParams {
  collection_id: number;
  offset?: number;
  limit?: number;
  search?: string;
}
```

### API Service

```typescript
// src/services/api.ts
import { invoke } from '@tauri-apps/api/core';
import type { Collection, Item, GetItemsParams } from '@/types/api.types';

export const api = {
  // Collections
  getCollections: () => invoke<Collection[]>('get_collections'),
  
  getCollection: (id: number) => 
    invoke<Collection | null>('get_collection', { id }),
  
  createCollection: (name: string, slug: string, icon?: string) =>
    invoke<Collection>('create_collection', { name, slug, icon }),
  
  deleteCollection: (id: number) =>
    invoke<void>('delete_collection', { id }),

  // Items
  getItems: (params: GetItemsParams) =>
    invoke<Item[]>('get_items', { params }),
  
  getItem: (id: number) =>
    invoke<Item | null>('get_item', { id }),
  
  createItem: (collectionId: number, title: string, properties?: object) =>
    invoke<Item>('create_item', { 
      params: { collection_id: collectionId, title, properties }
    }),
  
  deleteItem: (id: number) =>
    invoke<void>('delete_item', { id }),
};
```

### React Hook Example

```typescript
// src/hooks/useItems.ts
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Item } from '@/types/api.types';

export function useItems(collectionId: number) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await api.getItems({ collection_id: collectionId });
        setItems(data);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [collectionId]);

  return { items, loading, error };
}
```

---

## 6. ⚠️ Error Handling

### Command Error Pattern

```rust
use crate::core::error::VaultError;

#[tauri::command]
pub async fn get_item(
    state: State<'_, AppState>,
    id: i32,
) -> Result<Item, VaultError> {
    let item = ItemService::get_by_id(&state.db, id).await?;
    
    item.ok_or(VaultError::NotFound(format!("Item {} not found", id)))
}
```

### Frontend Error Handling

```typescript
try {
  const item = await api.getItem(123);
} catch (error) {
  // error is the serialized VaultError
  console.error('Failed to get item:', error);
  toast.error(error as string);
}
```

---

## 7. 🔔 Events (Backend → Frontend)

### Emit Event from Backend

```rust
use tauri::Emitter;

#[tauri::command]
pub async fn start_crawler(
    app: tauri::AppHandle,
    item_id: i32,
) -> Result<(), String> {
    // Start background task
    tokio::spawn(async move {
        // ... crawl logic ...
        
        // Notify frontend when done
        app.emit("item_updated", item_id).unwrap();
    });
    
    Ok(())
}
```

### Listen in Frontend

```typescript
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<number>('item_updated', (event) => {
    console.log('Item updated:', event.payload);
    refetchItem(event.payload);
  });

  return () => {
    unlisten.then(fn => fn());
  };
}, []);
```

---

## 🔗 Tài liệu Liên quan

- [Backend Overview](./1-overview.md)
- [Error Handling](./3-error-handling.md)
- [Services](./4-services.md)

---

_Cập nhật: 2026-01-08_
