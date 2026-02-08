# 🎮 Tauri Commands - Vaultrs

> **Mục tiêu:** Hướng dẫn cách tạo và sử dụng Tauri commands để giao tiếp giữa frontend và backend.

---

## 📋 TL;DR

| Concept             | Description                        |
| ------------------- | ---------------------------------- |
| `#[tauri::command]` | Macro đánh dấu function là command |
| `invoke()`          | Frontend gọi command               |
| `State<>`           | Access managed state               |
| `Result<T, E>`      | Return success hoặc error          |

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
import { invoke } from "@tauri-apps/api/core";

const greeting = await invoke<string>("greet", { name: "User" });
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

## 5. 🖼️ Image Commands

### image_commands.rs

```rust
// src/commands/image_commands.rs
use sea_orm::DatabaseConnection;
use tauri::State;

use crate::core::AppResult;
use crate::entry::{EntryDto, EntryImageService, EntryService};
use crate::image::{ImageProcessor, ImageStorage};

/// Uploads an entry cover image from a local file.
#[tauri::command]
pub async fn upload_entry_cover_image(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    file_path: String,
    app_data_dir: String,
) -> AppResult<EntryDto> {
    log::info!(
        "Uploading cover image for entry {} from file: {}",
        entry_id,
        file_path
    );

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    EntryImageService::set_cover_from_file(&db, entry_id, &file_path, &image_storage).await
}

/// Sets an entry cover image from a URL.
#[tauri::command]
pub async fn set_entry_cover_url(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    url: String,
    app_data_dir: String,
) -> AppResult<EntryDto> {
    log::info!(
        "Setting cover image for entry {} from URL: {}",
        entry_id,
        url
    );

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    EntryImageService::set_cover_from_url(&db, entry_id, &url, &image_storage).await
}

/// Gets the thumbnail for an entry's cover image as a base64-encoded data URL.
#[tauri::command]
pub async fn get_entry_thumbnail(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    app_data_dir: String,
) -> AppResult<String> {
    log::debug!("Getting thumbnail for entry {}", entry_id);

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    // Get entry
    let entry = EntryService::get(&db, entry_id).await?;

    // Generate thumbnail
    let thumbnail_bytes = EntryImageService::get_thumbnail(&entry, &image_storage)?;

    // Convert to data URL for frontend
    Ok(ImageProcessor::to_data_url(&thumbnail_bytes))
}

/// Removes the cover image from an entry.
#[tauri::command]
pub async fn remove_entry_cover(
    db: State<'_, DatabaseConnection>,
    entry_id: i32,
    app_data_dir: String,
) -> AppResult<EntryDto> {
    log::info!("Removing cover image from entry {}", entry_id);

    let image_storage = ImageStorage::new(std::path::Path::new(&app_data_dir));

    EntryImageService::remove_cover(&db, entry_id, &image_storage).await
}
```

### Registration

```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
    // ... other commands ...
    commands::upload_entry_cover_image,
    commands::set_entry_cover_url,
    commands::get_entry_thumbnail,
    commands::remove_entry_cover,
])
```

### Frontend Integration

#### TypeScript Types

```typescript
// src/modules/entry/types.ts
export interface Entry {
    id: number;
    vault_id: number;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    cover_image_path?: string | null;  // New field!
    created_at: string;
    updated_at: string;
}
```

#### API Service

```typescript
// src/modules/entry/api.ts
import { invoke } from "@tauri-apps/api/core";
import type { Entry } from "./types";

export const entryApi = {
    // ... other entry methods ...

    /**
     * Uploads a cover image from a local file
     * @param entryId - The entry ID
     * @param filePath - Absolute path to the image file
     * @returns Updated entry with cover_image_path
     */
    uploadEntryCoverImage: (entryId: number, filePath: string) =>
        invoke<Entry>("upload_entry_cover_image", {
            entry_id: entryId,
            file_path: filePath,
            app_data_dir: await appDataDir(),
        }),

    /**
     * Sets a cover image from a URL
     * @param entryId - The entry ID
     * @param url - URL to the image
     * @returns Updated entry with cover_image_path
     */
    setEntryCoverUrl: (entryId: number, url: string) =>
        invoke<Entry>("set_entry_cover_url", {
            entry_id: entryId,
            url,
            app_data_dir: await appDataDir(),
        }),

    /**
     * Gets the thumbnail for an entry's cover image
     * @param entryId - The entry ID
     * @returns Base64-encoded data URL (data:image/jpeg;base64,...)
     */
    getEntryThumbnail: (entryId: number) =>
        invoke<string>("get_entry_thumbnail", {
            entry_id: entryId,
            app_data_dir: await appDataDir(),
        }),

    /**
     * Removes the cover image from an entry
     * @param entryId - The entry ID
     * @returns Updated entry with cover_image_path = null
     */
    removeEntryCover: (entryId: number) =>
        invoke<Entry>("remove_entry_cover", {
            entry_id: entryId,
            app_data_dir: await appDataDir(),
        }),
};
```

#### React Component Example

```typescript
// src/modules/entry/components/CoverImageUploader.tsx
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { entryApi } from "../api";

interface Props {
    entryId: number;
    onSuccess: (entry: Entry) => void;
}

export function CoverImageUploader({ entryId, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState("");

    const handleFileUpload = async () => {
        try {
            setLoading(true);

            // Open file picker
            const file = await open({
                multiple: false,
                filters: [{
                    name: "Image",
                    extensions: ["jpg", "jpeg", "png", "webp", "gif"]
                }]
            });

            if (file) {
                const entry = await entryApi.uploadEntryCoverImage(entryId, file);
                onSuccess(entry);
            }
        } catch (error) {
            console.error("Failed to upload image:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUrlSubmit = async () => {
        try {
            setLoading(true);
            const entry = await entryApi.setEntryCoverUrl(entryId, url);
            onSuccess(entry);
            setUrl("");
        } catch (error) {
            console.error("Failed to set cover URL:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleFileUpload} disabled={loading}>
                Upload from file
            </button>

            <div>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Or paste image URL"
                />
                <button onClick={handleUrlSubmit} disabled={loading || !url}>
                    Set URL
                </button>
            </div>
        </div>
    );
}
```

#### Display Thumbnail Example

```typescript
// src/modules/entry/components/EntryRow.tsx
import { useQuery } from "@tanstack/react-query";
import { entryApi } from "../api";

interface Props {
    entry: Entry;
}

export function EntryRow({ entry }: Props) {
    const { data: thumbnail } = useQuery({
        queryKey: ["thumbnail", entry.id],
        queryFn: () => entryApi.getEntryThumbnail(entry.id),
        enabled: !!entry.cover_image_path,  // Only load if cover exists
        staleTime: 1000 * 60 * 5,  // Cache for 5 minutes
    });

    return (
        <div className="entry-row">
            {thumbnail ? (
                <img src={thumbnail} alt={entry.title} className="thumbnail" />
            ) : (
                <div className="placeholder">No image</div>
            )}
            <span>{entry.title}</span>
        </div>
    );
}
```

### Usage Examples

#### Complete Flow: Create Entry with Cover

```typescript
// Create entry
const entry = await entryApi.create({
    vault_id: 1,
    title: "The Matrix",
    description: "A sci-fi classic",
});

// Upload cover image
const updatedEntry = await entryApi.uploadEntryCoverImage(
    entry.id,
    "/path/to/matrix-poster.jpg"
);

// Or set from URL
const updatedEntry = await entryApi.setEntryCoverUrl(
    entry.id,
    "https://example.com/matrix-poster.jpg"
);
```

#### Update Cover Image

```typescript
// Replace existing cover with new one
const entry = await entryApi.uploadEntryCoverImage(
    existingEntry.id,
    "/path/to/new-image.png"
);
// Old image is automatically deleted
```

#### Remove Cover Image

```typescript
// Remove cover completely
const entry = await entryApi.removeEntryCover(entryId);
console.log(entry.cover_image_path);  // null
```

#### Batch Load Thumbnails

```typescript
// Load thumbnails for multiple entries
const thumbnails = await Promise.all(
    entries
        .filter(e => e.cover_image_path)
        .map(e => entryApi.getEntryThumbnail(e.id))
);
```

### Error Handling

#### Common Errors

```typescript
try {
    await entryApi.uploadEntryCoverImage(entryId, filePath);
} catch (error) {
    // "Image size exceeds 10MB limit"
    // "Invalid image format. Supported: JPEG, PNG, WebP, GIF"
    // "Failed to read image file"
    // "Entry not found"
    console.error(error);
}
```

#### Validation

**Backend** (automatic):
- File size limit: 10MB
- Format validation: JPEG, PNG, WebP, GIF only
- Path sanitization
- Entry existence check

**Frontend** (recommended):
```typescript
function validateImageFile(file: File): string | null {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return "Image must be less than 10MB";
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
        return "Invalid format. Use JPEG, PNG, WebP, or GIF";
    }

    return null;
}
```

---

## 6. 🌐 Frontend Integration

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
import { invoke } from "@tauri-apps/api/core";
import type { Collection, Item, GetItemsParams } from "@/types/api.types";

export const api = {
    // Collections
    getCollections: () => invoke<Collection[]>("get_collections"),

    getCollection: (id: number) =>
        invoke<Collection | null>("get_collection", { id }),

    createCollection: (name: string, slug: string, icon?: string) =>
        invoke<Collection>("create_collection", { name, slug, icon }),

    deleteCollection: (id: number) => invoke<void>("delete_collection", { id }),

    // Items
    getItems: (params: GetItemsParams) =>
        invoke<Item[]>("get_items", { params }),

    getItem: (id: number) => invoke<Item | null>("get_item", { id }),

    createItem: (collectionId: number, title: string, properties?: object) =>
        invoke<Item>("create_item", {
            params: { collection_id: collectionId, title, properties },
        }),

    deleteItem: (id: number) => invoke<void>("delete_item", { id }),
};
```

### React Hook Example

```typescript
// src/hooks/useItems.ts
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import type { Item } from "@/types/api.types";

export function useItems(collectionId: number) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const data = await api.getItems({
                    collection_id: collectionId,
                });
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

## 7. ⚠️ Error Handling

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
    console.error("Failed to get item:", error);
    toast.error(error as string);
}
```

---

## 8. 🔔 Events (Backend → Frontend)

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
import { listen } from "@tauri-apps/api/event";

useEffect(() => {
    const unlisten = listen<number>("item_updated", (event) => {
        console.log("Item updated:", event.payload);
        refetchItem(event.payload);
    });

    return () => {
        unlisten.then((fn) => fn());
    };
}, []);
```

---

## 🔗 Tài liệu Liên quan

-   [Backend Overview](./1-overview.md)
-   [Error Handling](./3-error-handling.md)
-   [Services](./4-services.md)

---

_Cập nhật: 2026-01-08_
