# 📚 Mục lục Tài liệu - Vaultrs

> **Mục tiêu:** Danh mục tổng hợp tất cả tài liệu trong dự án, giúp developer nhanh chóng tìm được thông tin cần thiết.

---

## 🗺️ Sơ đồ Nhanh

```
📂 docs/
├── 📁 00-meta/              ← Bạn đang ở đây
│   ├── Cấu trúc thư mục
│   ├── Quy ước đặt tên
│   ├── Hướng dẫn viết docs
│   ├── Từ điển thuật ngữ
│   ├── Quy ước versioning
│   └── Mục lục (file này)
│
├── 📁 01-architecture/      ← Kiến trúc hệ thống
├── 📁 02-database/          ← Database & storage
└── 📁 99-dev-notes/         ← Ghi chép developer
```

---

## 📋 Mục lục Chi tiết

### 📁 00-meta/ — Tài liệu về Tài liệu

Hướng dẫn cách tổ chức, viết và maintain tài liệu dự án.

| #   | Tài liệu                                         | Mô tả                                     |
| --- | ------------------------------------------------ | ----------------------------------------- |
| 1   | [📁 Cấu trúc Thư mục](./1-folder-structure.md)   | Mô tả chi tiết cấu trúc thư mục dự án     |
| 2   | [📝 Quy ước Đặt tên](./2-naming-convention.md)   | Naming conventions cho Rust, React, files |
| 3   | [📘 Hướng dẫn Viết Docs](./3-how-to-document.md) | Cách viết, đọc và maintain tài liệu       |
| 4   | [📖 Từ điển Thuật ngữ](./4-glossary.md)          | Định nghĩa các thuật ngữ dự án            |
| 5   | [🏷️ Quy ước Versioning](./5-versioning.md)       | Semantic versioning, changelog, release   |
| 6   | [📚 Mục lục Tài liệu](./6-docs-index.md)         | File này — danh mục tổng hợp              |

---

### 📁 01-architecture/ — Kiến trúc Hệ thống

Sơ đồ và giải thích kiến trúc tổng quan của Vaultrs.

| #   | Tài liệu                                                  | Mô tả                                                       |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | [🏗️ Tổng quan Kiến trúc](../01-architecture/1-overview.md) | Modular Monolith, three-layer, module overview               |
| 2   | [🔧 Thiết kế Hệ thống](../01-architecture/2-system-design.md) | Components, state management, image storage, testing     |
| 3   | [🛠️ Tech Stack](../01-architecture/3-tech-stack.md)        | Công nghệ, phiên bản, ghi chú nâng cấp                      |

---

### 📁 02-database/ — Database & Storage

Schema, format và cách lưu trữ dữ liệu.

| #   | Tài liệu                                                                          | Mô tả                                         |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | [💾 Tổng quan Database](../02-database/1-overview.md)                               | SQLite, WAL mode, EAV + JSON, targets          |
| 2   | [📋 Database Schema](../02-database/2-schema.md)                                   | DDL, columns, FTS5, schema diagram             |
| 3   | [⚡ Indexes & Performance](../02-database/3-indexes.md)                             | Index strategy, query optimization             |
| 4   | [🔍 Queries](../02-database/4-queries.md)                                          | Common queries, pagination, FTS5 search        |
| 5   | [🔄 Migrations](../02-database/5-migrations.md)                                    | SeaORM migration quy trình                     |
| 6   | [💾 Backup & Recovery](../02-database/6-backup.md)                                 | Backup strategies, restore                     |
| 7   | [📊 Field Data Handling](../02-database/7-field-data-handling.md)                   | JSON properties format, field types            |
| —   | [📋 Đặc tả Thiết kế Database](../02-database/database-design-specification.md)     | Entities, relationships, constraints, schema   |
| —   | [🔗 Kiến trúc Nguồn Asset](../02-database/asset-source-architecture.md)            | LOCAL/REMOTE dual-source, cache, state machine |
| —   | [🏷️ Hệ thống Multi-role Asset](../02-database/multi-role-asset-system.md)          | 7 role taxonomy, Singular/Plural constraints   |
| —   | [⚙️ Thiết kế CollectionSettings](../02-database/collection-settings-design.md)     | JSON settings, default cover, validation       |

---

### 📁 03-backend-rust/ — Backend Rust/Tauri

Tài liệu cho phần backend viết bằng Rust với Tauri framework.

| #   | Tài liệu             | Mô tả |
| --- | -------------------- | ----- |
|     | _Chưa viết_          |       |

**Nên có:**

-   [ ] Tauri commands API reference
-   [ ] Error handling guide
-   [ ] Module documentation
-   [ ] Testing guide

---

### 📁 04-frontend-react/ — Frontend React

Tài liệu cho phần frontend viết bằng React + TypeScript.

| #   | Tài liệu             | Mô tả |
| --- | -------------------- | ----- |
|     | _Chưa viết_          |       |

**Nên có:**

-   [ ] Component library / Design system
-   [ ] State management guide
-   [ ] UI/UX patterns
-   [ ] Accessibility (a11y) guide

---

### 📁 99-dev-notes/ — Ghi chép Developer

Ý tưởng, debug notes và ghi chép temporary.

| #   | Tài liệu                                         | Mô tả                              |
| --- | ------------------------------------------------ | ---------------------------------- |
| 1   | [💡 Ý tưởng & Features](../99-dev-notes/idea.md) | Danh sách ý tưởng và tính năng mới |

---

## 🚀 Quick Start cho Developer Mới

### Đọc theo thứ tự này:

```
1. README.md (root)           → Tổng quan dự án
2. CONTRIBUTING.md            → Hướng dẫn phát triển
3. docs/00-meta/1-folder-structure.md → Hiểu cấu trúc code
4. docs/00-meta/2-naming-convention.md → Quy ước đặt tên
5. docs/01-architecture/...   → Hiểu kiến trúc
```

### Theo nhiệm vụ:

| Bạn muốn...               | Đọc...                                             |
| ------------------------- | -------------------------------------------------- |
| Hiểu cấu trúc project     | [1-folder-structure.md](./1-folder-structure.md)   |
| Viết code đúng convention | [2-naming-convention.md](./2-naming-convention.md) |
| Viết/cập nhật tài liệu    | [3-how-to-document.md](./3-how-to-document.md)     |
| Hiểu thuật ngữ dự án      | [4-glossary.md](./4-glossary.md)                   |
| Hiểu cách đánh version    | [5-versioning.md](./5-versioning.md)               |
| Hiểu database schema      | `docs/02-database/`                                |
| Ghi ý tưởng mới           | [99-dev-notes/idea.md](../99-dev-notes/idea.md)    |

---

## 📂 Tài liệu Root

Các file quan trọng ở thư mục gốc:

| File                                           | Mô tả                              |
| ---------------------------------------------- | ---------------------------------- |
| [README.md](../../README.md)                   | Giới thiệu dự án, cài đặt, sử dụng |
| [CHANGELOG.md](../../CHANGELOG.md)             | Lịch sử thay đổi qua các version   |
| [CONTRIBUTING.md](../../CONTRIBUTING.md)       | Hướng dẫn phát triển               |
| [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) | Quy tắc ứng xử                     |

---

## 📊 Trạng thái Tài liệu

| Thư mục              | Trạng thái     | Ghi chú |
| --------------------- | --------------- | -------- |
| `00-meta/`            | ✅ Hoàn chỉnh   | 6 files — đã cập nhật khớp sản phẩm hiện tại (personal metadata vault). |
| `01-architecture/`    | ✅ Có nội dung  | 3 files: overview, system-design, tech-stack. Thiếu data-flow và design-patterns. |
| `02-database/`        | ✅ Đầy đủ       | 7 files: overview → schema → indexes → queries → migrations → backup → field-data-handling. |
| `03-backend-rust/`    | ❌ Chưa có     | Chưa có file nào — viết khi bắt đầu implement. |
| `04-frontend-react/`  | ❌ Chưa có     | Chưa có file nào — viết khi bắt đầu implement. |
| `99-dev-notes/`       | ✅ Có          | `idea.md` — ý tưởng cũ (password manager) đã được archive. |

---

## ✏️ Đóng góp Tài liệu

Phát hiện tài liệu thiếu hoặc sai? Xin hãy:

1. Tạo issue trên GitHub
2. Hoặc submit PR với bản cập nhật
3. Hoặc ghi vào `99-dev-notes/idea.md`

Xem thêm: [3-how-to-document.md](./3-how-to-document.md)

---

_Cập nhật: 2026-07-16_
