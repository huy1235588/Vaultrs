# 📖 Từ điển Thuật ngữ - Vaultrs

> **Mục tiêu:** Định nghĩa các thuật ngữ chuyên ngành sử dụng trong dự án, giúp developer mới nhanh chóng hiểu các khái niệm quan trọng.

---

## 📋 TL;DR - Thuật ngữ Quan trọng Nhất

| Thuật ngữ        | Định nghĩa ngắn                                                    |
| ---------------- | ------------------------------------------------------------------- |
| **Collection**   | Bộ sưu tập dữ liệu có schema riêng (Movies, Books, Games...)      |
| **Item**         | Một bản ghi trong Collection (một bộ phim, một cuốn sách...)       |
| **Attribute**    | Định nghĩa một trường dữ liệu tuỳ chỉnh trong Collection          |
| **Properties**   | Cột JSON trong bảng `items` lưu giá trị các Attributes             |
| **EAV**          | Entity–Attribute–Value — mô hình lưu trữ linh hoạt cho custom fields |

---

## 🗄️ Thuật ngữ Dữ liệu (Data Model)

### Collection

-   **Định nghĩa:** Đơn vị tổ chức cấp cao nhất — đại diện cho một loại dữ liệu do user tự định nghĩa
-   **Ví dụ:** Movies, TV Shows, Books, Games, Anime
-   **Đặc điểm:**
    -   Mỗi Collection có schema riêng (danh sách Attributes)
    -   Chứa nhiều Items
    -   Có `slug` duy nhất để identify trong URL/code

### Item

-   **Định nghĩa:** Một bản ghi dữ liệu trong Collection
-   **Ví dụ:** Phim "Inception", sách "Dune", game "Elden Ring"
-   **Đặc điểm:**
    -   Thuộc về đúng một Collection
    -   Có `title` (indexed) và cột `properties` (JSON) chứa giá trị các Attributes
    -   Bảng `items` là bảng lớn nhất — target 10M+ rows

### Attribute

-   **Định nghĩa:** Định nghĩa một trường dữ liệu tuỳ chỉnh cho Collection
-   **Ví dụ:** "Director" (text), "Rating" (decimal), "Genre" (multiselect)
-   **Đặc điểm:**
    -   Thuộc về đúng một Collection
    -   Có `key` duy nhất trong Collection — dùng làm key trong JSON `properties`
    -   Có `type` xác định kiểu dữ liệu và component UI tương ứng

### Properties (JSON)

-   **Định nghĩa:** Cột TEXT trong bảng `items` lưu giá trị các Attributes dưới dạng JSON object
-   **Ví dụ:**
    ```json
    {
        "director": "Christopher Nolan",
        "rating": 8.8,
        "genre": ["Sci-Fi", "Thriller"]
    }
    ```
-   **Đặc điểm:** Cho phép mỗi Collection có schema riêng mà không cần migration

### EAV (Entity–Attribute–Value)

-   **Định nghĩa:** Mô hình lưu trữ cho phép thêm trường dữ liệu tuỳ ý mà không cần thay đổi schema bảng
-   **Trong Vaultrs:** Kết hợp EAV (bảng `attributes` định nghĩa schema) với JSON column (`properties`) để đạt cả flexibility và query performance
-   **Lợi ích:** User tạo field mới cho Collection mà không cần database migration

### Relation (Cross-Collection Link)

-   **Định nghĩa:** Liên kết giữa Items thuộc các Collections khác nhau
-   **Ví dụ:** Item "Inception" (Movies) liên kết tới Item "Christopher Nolan" (Directors)
-   **Đặc điểm:**
    -   Sử dụng Attribute type `reference` để lưu ID của Item đích
    -   Cho phép xây dựng Knowledge Graph cá nhân
    -   Được resolve tại thời điểm query

### Slug

-   **Định nghĩa:** Chuỗi URL-friendly, duy nhất, được tạo từ tên Collection
-   **Ví dụ:** `"Movies"` → `"movies"`, `"TV Shows"` → `"tv-shows"`
-   **Mục đích:** Dùng để identify Collection trong URL, API calls, và code

---

## 🏗️ Thuật ngữ Kiến trúc (Architecture)

### Tauri

-   **Định nghĩa:** Framework phát triển ứng dụng desktop đa nền tảng, dùng Rust cho backend và WebView cho frontend
-   **Phiên bản:** v2
-   **So với Electron:** Binary nhỏ hơn (~8MB vs ~150MB), memory thấp hơn, bảo mật tốt hơn

### Command (Tauri)

-   **Định nghĩa:** Function Rust được expose cho frontend gọi qua IPC
-   **Syntax:** `#[tauri::command]`

```rust
#[tauri::command]
async fn get_items(collection_id: i32) -> Result<Vec<Item>, String> { }
```

### IPC (Inter-Process Communication)

-   **Định nghĩa:** Cơ chế giao tiếp giữa frontend (WebView) và backend (Rust process)
-   **Trong Tauri:** Sử dụng `invoke()` function

```typescript
const items = await invoke("get_items", { collectionId: 1 });
```

### Module

-   **Định nghĩa:** Đơn vị tổ chức code theo feature/domain
-   **Backend:** `collections/`, `items/`, `custom_fields/`, `relations/`, `search/`
-   **Frontend:** `modules/vault/` (Collections), `modules/entry/` (Items)

### Modular Monolith

-   **Định nghĩa:** Kiến trúc ứng dụng — tất cả components trong một process duy nhất nhưng được tổ chức theo module rõ ràng với ranh giới tường minh
-   **Lợi ích:** Đơn giản deploy (một file executable), dễ debug, phù hợp single-user desktop app

### State Management

-   **Định nghĩa:** Cách quản lý và chia sẻ dữ liệu trong ứng dụng
-   **Frontend:** React Context, URL state, TanStack Query
-   **Backend:** Tauri Managed State (`AppState`)

---

## 💾 Thuật ngữ Database

### SQLite

-   **Định nghĩa:** Hệ quản trị cơ sở dữ liệu nhúng, lưu trong một file duy nhất
-   **Trong Vaultrs:** Database chính, lưu tại `<app_data_dir>/vaultrs.db`
-   **Phiên bản tối thiểu:** 3.53.0+ (bản vá lỗi WAL-reset quan trọng)

### WAL Mode (Write-Ahead Logging)

-   **Định nghĩa:** Chế độ ghi của SQLite cho phép đọc đồng thời trong khi đang ghi
-   **Lợi ích cho Vaultrs:**
    -   UI không bị block khi background crawler đang write
    -   Crash recovery tốt hơn
    -   Hiệu năng ghi nhanh hơn

### FTS5 (Full-Text Search 5)

-   **Định nghĩa:** Extension của SQLite hỗ trợ tìm kiếm toàn văn có xếp hạng
-   **Trong Vaultrs:** Virtual table `items_fts` index `title` và `properties` của Items
-   **Sử dụng:** `SELECT * FROM items_fts WHERE items_fts MATCH 'nolan AND thriller'`

### SeaORM

-   **Định nghĩa:** ORM (Object-Relational Mapping) async-first cho Rust
-   **Phiên bản:** 2.0
-   **Vai trò:** Truy vấn database type-safe, quản lý migration, entity modeling

### Migration

-   **Định nghĩa:** Script thay đổi schema database có version control
-   **Công cụ:** `sea-orm-cli migrate`
-   **Đặc điểm:** Chạy tự động khi khởi động app, theo thứ tự timestamp

---

## ⚡ Thuật ngữ Hiệu năng (Performance)

### Virtual Scrolling

-   **Định nghĩa:** Kỹ thuật chỉ render các row đang nhìn thấy trên viewport, thay vì render toàn bộ danh sách
-   **Thư viện:** TanStack Virtual
-   **Lợi ích:** Memory usage O(1) thay vì O(n) — render ~50 rows thay vì 10M

### Pagination

-   **Định nghĩa:** Chia kết quả truy vấn thành các "trang" nhỏ (offset + limit)
-   **Kết hợp với:** Virtual scrolling để chỉ fetch dữ liệu cần thiết từ database

---

## 📚 Viết tắt Thường dùng

| Viết tắt | Đầy đủ                            |
| -------- | ---------------------------------- |
| API      | Application Programming Interface |
| CRUD     | Create, Read, Update, Delete       |
| DTO      | Data Transfer Object               |
| EAV      | Entity–Attribute–Value             |
| FK       | Foreign Key                        |
| FTS      | Full-Text Search                   |
| IPC      | Inter-Process Communication        |
| ORM      | Object-Relational Mapping          |
| PK       | Primary Key                        |
| UI       | User Interface                     |
| UX       | User Experience                    |
| WAL      | Write-Ahead Logging                |

---

## 🔗 Tài liệu Liên quan

-   [Cấu trúc thư mục](./1-folder-structure.md)
-   [Quy ước đặt tên](./2-naming-convention.md)
-   [Hướng dẫn viết docs](./3-how-to-document.md)

---

_Cập nhật: 2026-07-16_
