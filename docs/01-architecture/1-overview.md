# 🏗️ Tổng quan Kiến trúc - Vaultrs

> **Mục tiêu:** Giới thiệu tổng quan về kiến trúc hệ thống Vaultrs, giúp developer mới nhanh chóng hiểu được thiết kế và cấu trúc dự án.

---

## 📋 TL;DR

| Thành phần       | Công nghệ          | Vai trò                          |
| ---------------- | ------------------ | -------------------------------- |
| **Frontend**     | React + TypeScript | Giao diện người dùng             |
| **Backend**      | Rust + Tauri v2    | Xử lý logic, quản lý dữ liệu     |
| **Database**     | SQLite (WAL Mode)  | Lưu trữ dữ liệu nhúng            |
| **Architecture** | Modular Monolith   | Tổ chức code theo module/feature |

---

## 1. 📖 Giới thiệu Dự án

**Vaultrs** là ứng dụng desktop quản lý bộ sưu tập media cá nhân quy mô lớn, được thiết kế để xử lý **10+ triệu records** mà không cần server hay hạ tầng phức tạp.

### Đặc điểm Chính

```
┌─────────────────────────────────────────────────────────────┐
│                     🎯 VAULTRS                              │
│       High-Performance Personal Media Vault                 │
├─────────────────────────────────────────────────────────────┤
│  🚀 Native Performance    │  ⚡ 10M+ Records Support       │
│  💾 Zero-Config Database  │  🔒 Privacy-First (Offline)      │
│  🎨 Dynamic Schema        │  📦 Single File Storage        │
└─────────────────────────────────────────────────────────────┘
```

### Use Cases

-   **Media Collections**: Quản lý phim, series, anime, music
-   **Book Library**: Theo dõi sách, ebooks, manga
-   **Photo Archive**: Tổ chức ảnh cá nhân
-   **Scientific Records**: Quản lý dữ liệu nghiên cứu
-   **Inventory**: Theo dõi đồ vật, thiết bị

---

## 2. 🏛️ Kiến trúc Tổng quan

### Modular Monolith Architecture

Vaultrs sử dụng kiến trúc **Modular Monolith** - tất cả components trong một ứng dụng đơn nhất nhưng được tổ chức theo module rõ ràng.

```
┌────────────────────────────────────────────────────────────┐
│                     DESKTOP APPLICATION                    │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PRESENTATION LAYER                     │   │
│  │  React 18 + TypeScript + Vite + TanStack            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕ IPC                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               SERVICE LAYER (Rust)                  │   │
│  │  Tauri Commands + Business Logic + Tokio            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕ ORM                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                DATA LAYER                           │   │
│  │  SQLite (WAL Mode) + SeaORM                         │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Tại sao Modular Monolith?

| Ưu điểm                 | Giải thích                              |
| ----------------------- | --------------------------------------- |
| **Đơn giản để deploy**  | Một file executable duy nhất            |
| **Performance tốt**     | Không có network overhead giữa services |
| **Dễ debug**            | Tất cả code trong một process           |
| **Module boundaries**   | Dễ tách thành microservices sau này     |
| **Phù hợp single-user** | Desktop app không cần scale horizontal  |

---

## 3. 📐 Three-Layer Architecture

### Layer 1: Presentation Layer (Frontend)

```typescript
// React Components → UI Rendering
// TanStack Table → Data Grid Logic
// TanStack Virtual → 10M Row Virtualization
```

**Trách nhiệm:**

-   Render UI components
-   Handle user interactions
-   Virtual scrolling cho large datasets
-   State management

### Layer 2: Service Layer (Backend)

```rust
// Tauri Commands → Entry points từ frontend
// Services → Business logic
// Repositories → Data access abstraction
```

**Trách nhiệm:**

-   Xử lý business logic
-   Validation dữ liệu
-   Background tasks (crawling)
-   Error handling

### Layer 3: Data Layer (Database)

```rust
// SeaORM → ORM queries
// SQLite → Embedded database
// Migrations → Schema evolution
```

**Trách nhiệm:**

-   Lưu trữ dữ liệu
-   Query execution
-   Data integrity
-   Indexing & optimization

---

## 4. 🔄 Giao tiếp giữa các Layer

### Frontend ↔ Backend (IPC)

```
Frontend (React)          Backend (Rust)
     │                         │
     ├──── invoke(cmd) ───────►│
     │                         │ Execute command
     │◄──── Result<T> ─────────│
     │                         │
```

Sử dụng **Tauri IPC** - giao tiếp type-safe giữa JavaScript và Rust.

### Backend ↔ Database (ORM)

```rust
// SeaORM provides:
// - Async queries
// - Type-safe models
// - Migration support
// - Connection pooling
```

---

## 5. 🧩 Module Overview

### Backend Modules (Rust)

```
src-tauri/src/
├── core/          # Utilities, errors, config
├── crypto/        # Encryption, hashing (nếu cần)
├── auth/          # Authentication (tùy chọn)
├── vault/         # Collection/vault management
├── entry/         # Item CRUD operations
├── generator/     # ID generation, utilities
└── crawler/       # Background metadata fetching
```

### Frontend Modules (React)

```
src/modules/
├── auth/          # Login, unlock screens
├── vault/         # Collection management
├── entry/         # Item list, details, forms
└── generator/     # Utility components
```

---

## 6. 🎯 Design Principles

### 1. Separation of Concerns

Mỗi layer/module có trách nhiệm riêng biệt:

```
UI Logic     → React Components
Business     → Rust Services
Data Access  → Repositories
Storage      → SQLite
```

### 2. Dependency Inversion

High-level modules không phụ thuộc vào low-level modules:

```rust
// Service depends on trait, not concrete impl
pub struct ItemService {
    repository: Arc<dyn ItemRepository>,
}
```

### 3. Single Responsibility

Mỗi module chỉ làm một việc:

```
vault/    → Quản lý collections
entry/    → Quản lý items
crawler/  → Fetch metadata
```

### 4. Privacy-First

-   Tất cả dữ liệu lưu local
-   Không gửi data lên cloud (mặc định)
-   Hoạt động 100% offline

---

## 7. 📊 Scalability Design

### Hỗ trợ 10M+ Records

```
┌─────────────────────────────────────────────┐
│          VIRTUAL SCROLLING                  │
│  Only render visible rows (~50)             │
│  Memory usage: O(1) instead of O(n)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          INDEXED QUERIES                    │
│  Full-text search với SQLite FTS            │
│  B-tree indexes cho sorting                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          WAL MODE                           │
│  Concurrent reads during writes             │
│  Better crash recovery                      │
└─────────────────────────────────────────────┘
```

### Performance Targets

| Operation         | Target  | Strategy           |
| ----------------- | ------- | ------------------ |
| Initial Load      | < 500ms | Pagination + index |
| Scroll Frame Rate | 60 FPS  | Virtual scrolling  |
| Search            | < 100ms | SQLite FTS         |
| Insert            | < 10ms  | Optimized writes   |

---

## 🔗 Tài liệu Liên quan

-   [Thiết kế Hệ thống Chi tiết](./2-system-design.md)
-   [Công nghệ Sử dụng](./3-tech-stack.md)
-   [Luồng Dữ liệu](./4-data-flow.md)
-   [Design Patterns](./5-design-patterns.md)
-   [Database Schema](../02-database/)

---

_Cập nhật: 2026-01-08_
