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
├── 📁 03-backend-rust/      ← Backend Rust/Tauri
├── 📁 04-frontend-react/    ← Frontend React
└── 📁 99-dev-notes/         ← Ghi chép developer
```

---

## 📋 Mục lục Chi tiết

### 📁 00-meta/ — Tài liệu về Tài liệu

Hướng dẫn cách tổ chức, viết và maintain tài liệu dự án.

| # | Tài liệu | Mô tả |
|---|----------|-------|
| 1 | [📁 Cấu trúc Thư mục](./1-folder-structure.md) | Mô tả chi tiết cấu trúc thư mục dự án |
| 2 | [📝 Quy ước Đặt tên](./2-naming-convention.md) | Naming conventions cho Rust, React, files |
| 3 | [📘 Hướng dẫn Viết Docs](./3-how-to-document.md) | Cách viết, đọc và maintain tài liệu |
| 4 | [📖 Từ điển Thuật ngữ](./4-glossary.md) | Định nghĩa các thuật ngữ chuyên ngành |
| 5 | [🏷️ Quy ước Versioning](./5-versioning.md) | Semantic versioning, changelog, release |
| 6 | [📚 Mục lục Tài liệu](./6-docs-index.md) | File này — danh mục tổng hợp |

---

### 📁 01-architecture/ — Kiến trúc Hệ thống

Sơ đồ và giải thích kiến trúc tổng quan của Vaultrs.

| # | Tài liệu | Mô tả |
|---|----------|-------|
| | _Đang phát triển..._ | |

**Nên có:**
- [ ] Kiến trúc tổng quan (Tauri + React)
- [ ] Data flow diagram
- [ ] Security architecture
- [ ] Deployment architecture

---

### 📁 02-database/ — Database & Storage

Schema, format và cách lưu trữ dữ liệu.

| # | Tài liệu | Mô tả |
|---|----------|-------|
| | _Đang phát triển..._ | |

**Nên có:**
- [ ] Vault file format specification
- [ ] Entry schema & fields
- [ ] Migration guide
- [ ] Backup & restore

---

### 📁 03-backend-rust/ — Backend Rust/Tauri

Tài liệu cho phần backend viết bằng Rust với Tauri framework.

| # | Tài liệu | Mô tả |
|---|----------|-------|
| | _Đang phát triển..._ | |

**Nên có:**
- [ ] Tauri commands API reference
- [ ] Cryptography implementation
- [ ] Error handling guide
- [ ] Module documentation
- [ ] Testing guide

---

### 📁 04-frontend-react/ — Frontend React

Tài liệu cho phần frontend viết bằng React + TypeScript.

| # | Tài liệu | Mô tả |
|---|----------|-------|
| | _Đang phát triển..._ | |

**Nên có:**
- [ ] Component library / Design system
- [ ] State management guide
- [ ] UI/UX patterns
- [ ] Accessibility (a11y) guide
- [ ] Testing guide

---

### 📁 99-dev-notes/ — Ghi chép Developer

Ý tưởng, debug notes và ghi chép temporary.

| # | Tài liệu | Mô tả |
|---|----------|-------|
| 1 | [💡 Ý tưởng & Features](../99-dev-notes/idea.md) | Danh sách ý tưởng và tính năng mới |

---

## 🚀 Quick Start cho Developer Mới

### Đọc theo thứ tự này:

```
1. README.md (root)           → Tổng quan dự án
2. CONTRIBUTING.md            → Hướng dẫn đóng góp
3. docs/00-meta/1-folder-structure.md → Hiểu cấu trúc code
4. docs/00-meta/2-naming-convention.md → Quy ước đặt tên
5. docs/01-architecture/...   → Hiểu kiến trúc
```

### Theo nhiệm vụ:

| Bạn muốn... | Đọc... |
|-------------|--------|
| Hiểu cấu trúc project | [1-folder-structure.md](./1-folder-structure.md) |
| Viết code đúng convention | [2-naming-convention.md](./2-naming-convention.md) |
| Viết/cập nhật tài liệu | [3-how-to-document.md](./3-how-to-document.md) |
| Hiểu thuật ngữ crypto | [4-glossary.md](./4-glossary.md) |
| Hiểu cách đánh version | [5-versioning.md](./5-versioning.md) |
| Làm backend Rust | `docs/03-backend-rust/` |
| Làm frontend React | `docs/04-frontend-react/` |
| Ghi ý tưởng mới | [99-dev-notes/idea.md](../99-dev-notes/idea.md) |

---

## 📂 Tài liệu Root

Các file quan trọng ở thư mục gốc:

| File | Mô tả |
|------|-------|
| [README.md](../../README.md) | Giới thiệu dự án, cài đặt, sử dụng |
| [CHANGELOG.md](../../CHANGELOG.md) | Lịch sử thay đổi qua các version |
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | Hướng dẫn đóng góp code |
| [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) | Quy tắc ứng xử cộng đồng |

---

## 🔍 Tìm kiếm Nhanh

### Theo Công nghệ

| Công nghệ | Tài liệu liên quan |
|-----------|-------------------|
| **Rust** | `03-backend-rust/`, `00-meta/2-naming-convention.md` |
| **Tauri** | `03-backend-rust/`, `01-architecture/` |
| **React** | `04-frontend-react/`, `00-meta/2-naming-convention.md` |
| **TypeScript** | `04-frontend-react/`, `00-meta/2-naming-convention.md` |
| **Cryptography** | `03-backend-rust/`, `00-meta/4-glossary.md` |

### Theo Chủ đề

| Chủ đề | Tài liệu liên quan |
|--------|-------------------|
| **Bảo mật** | `03-backend-rust/`, `01-architecture/` |
| **UI/UX** | `04-frontend-react/` |
| **Testing** | `03-backend-rust/`, `04-frontend-react/` |
| **DevOps** | `01-architecture/` |

---

## 📊 Trạng thái Tài liệu

| Thư mục | Trạng thái | Độ hoàn thiện |
|---------|------------|---------------|
| `00-meta/` | ✅ Có | ████████░░ 80% |
| `01-architecture/` | 🔄 Đang làm | ██░░░░░░░░ 20% |
| `02-database/` | 🔄 Đang làm | ██░░░░░░░░ 20% |
| `03-backend-rust/` | 🔄 Đang làm | ██░░░░░░░░ 20% |
| `04-frontend-react/` | 🔄 Đang làm | ██░░░░░░░░ 20% |
| `99-dev-notes/` | ✅ Có | ████████░░ 80% |

---

## ✏️ Đóng góp Tài liệu

Phát hiện tài liệu thiếu hoặc sai? Xin hãy:

1. Tạo issue trên GitHub
2. Hoặc submit PR với bản cập nhật
3. Hoặc ghi vào `99-dev-notes/idea.md`

Xem thêm: [3-how-to-document.md](./3-how-to-document.md)

---

_Cập nhật: 2025-12-26_
