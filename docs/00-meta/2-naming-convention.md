# 📝 Quy ước Đặt tên - Vaultrs

> **Mục tiêu:** Đảm bảo code nhất quán, dễ đọc và dễ maintain bằng cách tuân thủ naming conventions chuẩn.

---

## 📋 TL;DR - Bảng Tóm tắt

| Loại                 | Convention                      | Ví dụ                                           |
| -------------------- | ------------------------------- | ----------------------------------------------- |
| **Rust**             |                                 |                                                 |
| Module               | `snake_case`                    | `custom_fields`, `collection_service`           |
| Struct/Enum          | `PascalCase`                    | `Collection`, `AttributeType`                   |
| Function/Method      | `snake_case`                    | `create_item()`, `get_collections()`            |
| Constant             | `SCREAMING_SNAKE_CASE`          | `MAX_ITEMS_PER_PAGE`, `DEFAULT_PAGE_SIZE`       |
| Variable             | `snake_case`                    | `collection_id`, `item_data`                    |
| **React/TypeScript** |                                 |                                                 |
| Component            | `PascalCase`                    | `ItemList`, `CollectionHeader`                  |
| Hook                 | `camelCase` với prefix `use`    | `useCollection()`, `useItems()`                 |
| Function             | `camelCase`                     | `handleSubmit()`, `validateTitle()`             |
| Variable             | `camelCase`                     | `collectionId`, `itemEntries`                   |
| Constant             | `SCREAMING_SNAKE_CASE`          | `API_BASE_URL`, `MAX_RETRIES`                   |
| Interface/Type       | `PascalCase`                    | `Collection`, `AttributeConfig`                 |
| **Files**            |                                 |                                                 |
| Rust file            | `snake_case.rs`                 | `collection_service.rs`, `item_repo.rs`         |
| React component      | `PascalCase.tsx`                | `ItemList.tsx`, `CollectionHeader.tsx`           |
| Hook                 | `camelCase.ts` với prefix `use` | `useCollection.ts`, `useItems.ts`               |
| Utility              | `camelCase.ts`                  | `validation.ts`, `formatting.ts`                |

---

## 1. 🦀 Rust Backend Naming

### 1.1 Modules

**Quy tắc:** `snake_case`, tên ngắn gọn, mô tả chức năng

```rust
// ✅ ĐÚNG
mod custom_fields;
mod collection_service;
mod item_repository;

// ❌ SAI
mod CustomFields;      // Không dùng PascalCase
mod collection-service; // Không dùng kebab-case
mod colsvc;            // Quá ngắn, không rõ nghĩa
```

### 1.2 Structs & Enums

**Quy tắc:** `PascalCase`, tên rõ nghĩa

```rust
// ✅ ĐÚNG
struct Collection {
    id: i32,
    name: String,
    slug: String,
    description: Option<String>,
}

enum AttributeType {
    Text,
    Number,
    Decimal,
    Select,
    MultiSelect,
    Date,
    Checkbox,
    Url,
    Image,
    Reference,
}

// ❌ SAI
struct collection { }      // Không dùng snake_case
struct Col { }             // Quá ngắn
enum attribute_type { }    // Không dùng snake_case
```

### 1.3 Functions & Methods

**Quy tắc:** `snake_case`, động từ + danh từ

```rust
// ✅ ĐÚNG
fn create_item(collection_id: i32, title: &str) -> Result<Item, Error> { }
fn get_collections() -> Vec<Collection> { }
fn update_attribute(id: i32, name: &str) -> Result<(), Error> { }
fn delete_items_by_collection(collection_id: i32) -> Result<u64, Error> { }

// ❌ SAI
fn CreateItem() { }            // Không dùng PascalCase
fn getCollections() { }        // Không dùng camelCase
fn col_del() { }               // Tên không rõ nghĩa
```

### 1.4 Constants

**Quy tắc:** `SCREAMING_SNAKE_CASE`

```rust
// ✅ ĐÚNG
const MAX_ITEMS_PER_PAGE: usize = 100;
const DEFAULT_PAGE_SIZE: u64 = 50;
const MAX_TITLE_LENGTH: usize = 255;

// ❌ SAI
const maxItemsPerPage: usize = 100;    // Không dùng camelCase
const Max_Items_Per_Page: usize = 100; // Không nhất quán
```

### 1.5 Variables

**Quy tắc:** `snake_case`, tên mô tả rõ ràng

```rust
// ✅ ĐÚNG
let collection_id = 42;
let item_count = items.len();
let search_results = search_items(&query).await?;

// ❌ SAI
let CollectionId = 42;   // Không dùng PascalCase
let cid = 42;            // Quá ngắn
let data1 = vec![];      // Tên không có nghĩa
```

---

## 2. ⚛️ React/TypeScript Frontend Naming

### 2.1 Components

**Quy tắc:** `PascalCase`, tên rõ nghĩa, file cùng tên

```tsx
// ✅ ĐÚNG
// File: ItemList.tsx
export function ItemList() {
    return <div>...</div>;
}

// File: CollectionHeader.tsx
export function CollectionHeader() {
    return <header>...</header>;
}

// ❌ SAI
// File: itemList.tsx
export function item_list() {} // Không dùng snake_case

// File: ColHdr.tsx
export function CH() {} // Tên quá ngắn
```

### 2.2 Custom Hooks

**Quy tắc:** `camelCase`, prefix `use`, file cùng tên

```tsx
// ✅ ĐÚNG
// File: useCollection.ts
export function useCollection(id: number) {
    const [collection, setCollection] = useState<Collection | null>(null);
    // ...
    return { collection, setCollection };
}

// File: useItems.ts
export function useItems(collectionId: number) {
    // ...
}

// ❌ SAI
// File: collection.ts
export function collectionHook() {} // Thiếu prefix 'use'

// File: UseCollection.ts
export function UseCollection() {} // Không dùng PascalCase cho hook
```

### 2.3 Functions

**Quy tắc:** `camelCase`, động từ + danh từ

```tsx
// ✅ ĐÚNG
function handleSubmit(event: FormEvent) {}
function validateTitle(title: string): boolean {}
function formatDate(date: Date): string {}

// ❌ SAI
function HandleSubmit() {} // Không dùng PascalCase
function validate_title() {} // Không dùng snake_case
function submit() {} // Tên quá chung chung
```

### 2.4 Variables & State

**Quy tắc:** `camelCase`

```tsx
// ✅ ĐÚNG
const [collectionName, setCollectionName] = useState("");
const [items, setItems] = useState<Item[]>([]);
const isLoading = false;

// ❌ SAI
const [CollectionName, setCollectionName] = useState(""); // PascalCase
const [collection_name, set_collection_name] = useState(""); // snake_case
const [cn, setCn] = useState(""); // Quá ngắn
```

### 2.5 Interfaces & Types

**Quy tắc:** `PascalCase`, prefix `I` cho interface (optional)

```tsx
// ✅ ĐÚNG
interface Collection {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

type AttributeConfig = {
    type: "text" | "number" | "select" | "multiselect";
    required: boolean;
    options?: string[];
};

// ❌ SAI
interface collection {} // Không dùng camelCase
type attribute_config = {}; // Không dùng snake_case
```

### 2.6 Constants

**Quy tắc:** `SCREAMING_SNAKE_CASE`

```tsx
// ✅ ĐÚNG
const DEFAULT_PAGE_SIZE = 50;
const MAX_RETRIES = 3;
const SEARCH_DEBOUNCE_MS = 300;

// ❌ SAI
const defaultPageSize = 50; // camelCase
const MaxRetries = 3; // PascalCase
```

---

## 3. 📁 File & Folder Naming

### 3.1 Rust Files

**Quy tắc:** `snake_case.rs`

```
✅ ĐÚNG
src/
├── main.rs
├── collection_service.rs
├── item_repository.rs
├── search_engine.rs
└── models/
    ├── mod.rs
    ├── collection.rs
    └── attribute.rs

❌ SAI
src/
├── CollectionService.rs  // PascalCase
├── item-repository.rs    // kebab-case
└── srcheng.rs            // Tên không rõ nghĩa
```

### 3.2 React/TypeScript Files

**Quy tắc:**

-   Components: `PascalCase.tsx`
-   Hooks: `camelCase.ts` với prefix `use`
-   Utils: `camelCase.ts`

```
✅ ĐÚNG
src/
├── components/
│   ├── ItemList.tsx
│   ├── CollectionHeader.tsx
│   └── AttributeEditor.tsx
├── hooks/
│   ├── useCollection.ts
│   ├── useItems.ts
│   └── useSearch.ts
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   └── dateUtils.ts
└── types/
    └── collection.ts

❌ SAI
src/
├── components/
│   ├── item-list.tsx       // kebab-case
│   └── itemList.tsx        // camelCase
└── hooks/
    └── collection.ts       // Thiếu prefix 'use'
```

### 3.3 Folders

**Quy tắc:** `kebab-case` hoặc `snake_case`, nhất quán trong dự án

```
✅ ĐÚNG (kebab-case)
docs/
├── 00-meta/
├── 01-architecture/
├── 02-database/
└── 99-dev-notes/

✅ ĐÚNG (snake_case)
src/
├── custom_fields/
├── collection_service/
└── item_repository/

❌ SAI
docs/
├── 00Meta/              // PascalCase
├── 01_Architecture/     // Lẫn lộn
└── 99-DevNotes/         // Không nhất quán
```

---

## 4. 🎯 Naming Best Practices

### 4.1 Tên Biến Boolean

Prefix: `is`, `has`, `should`, `can`

```rust
// ✅ ĐÚNG
let is_required = true;
let has_items = false;
let should_index = true;
let can_delete = check_permission();

// ❌ SAI
let required = true;       // Không rõ là boolean
let items = false;         // Có thể nhầm với collection
```

```tsx
// ✅ ĐÚNG
const isLoading = false;
const hasError = true;
const shouldShowModal = false;

// ❌ SAI
const loading = false;
const error = true;
```

### 4.2 Tên Function

Động từ + Danh từ

```rust
// ✅ ĐÚNG
fn get_collection(id: i32) -> Option<Collection> { }
fn create_item(data: CreateItemDto) -> Result<Item, Error> { }
fn delete_attribute(id: i32) -> Result<(), Error> { }
fn search_items(query: &str) -> Vec<Item> { }

// ❌ SAI
fn collection(id: i32) { }      // Thiếu động từ
fn item(id: i32) { }            // Quá chung chung
fn do_stuff() { }               // Không rõ nghĩa
```

### 4.3 Tên Collection

Dùng số nhiều

```rust
// ✅ ĐÚNG
let collections = vec![];
let items = vec![];
let attributes = vec![];

// ❌ SAI
let collection_list = vec![];    // Dài dòng
let item_array = vec![];        // Không cần suffix 'array'
```

```tsx
// ✅ ĐÚNG
const collections = [];
const items = [];

// ❌ SAI
const collectionList = [];
const itemArr = [];
```

### 4.4 Tránh Abbreviations

Trừ khi abbreviation rất phổ biến

```rust
// ✅ ĐÚNG
let configuration = Config::new();
let identifier = "abc123";
let collection_name = "Movies";

// ⚠️ OK (abbreviation phổ biến)
let id = "abc123";
let url = "https://example.com";
let fts = FullTextSearch::new();

// ❌ SAI
let cfg = Config::new();          // Không rõ nghĩa
let col_nm = "Movies";           // Dùng đầy đủ
let attr = get_attribute();       // Dùng 'attribute'
```

---

## 5. 🔗 Ánh xạ Thuật ngữ: Module Code ↔ Domain

Tên module trong code có thể khác với thuật ngữ domain do lý do lịch sử. Bảng dưới thống nhất:

| Module code (Rust) | Module code (React) | Thuật ngữ Domain | Mô tả                          |
| ------------------- | -------------------- | ----------------- | -------------------------------- |
| `collections/`      | `modules/vault/`     | **Collection**    | Quản lý bộ sưu tập              |
| `items/`            | `modules/entry/`     | **Item**          | Quản lý bản ghi                  |
| `custom_fields/`    | —                    | **Attribute**     | Quản lý trường dữ liệu tuỳ chỉnh |
| `relations/`        | —                    | **Relation**      | Liên kết cross-collection        |
| `search/`           | —                    | **Search**        | FTS5 indexing và query           |

> 💡 **Khi đặt tên:** Ưu tiên dùng thuật ngữ domain (`Collection`, `Item`, `Attribute`) trong tài liệu, comments, và variable names. Tên module/thư mục giữ nguyên để tránh breaking changes.

---

## 6. 📚 Tài liệu Tham khảo

-   [Rust API Guidelines - Naming](https://rust-lang.github.io/api-guidelines/naming.html)
-   [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
-   [React Naming Conventions](https://github.com/airbnb/javascript/tree/master/react)

---

## 🔗 Tài liệu Liên quan

-   [Cấu trúc thư mục](./1-folder-structure.md)
-   [Hướng dẫn viết docs](./3-how-to-document.md)

---

_Cập nhật: 2026-07-16_
