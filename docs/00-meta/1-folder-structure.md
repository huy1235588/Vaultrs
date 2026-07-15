# 📁 Cấu trúc Thư mục - Vaultrs

> **Mục tiêu:** Mô tả chi tiết cấu trúc thư mục của dự án Vaultrs, giúp developer mới nhanh chóng hiểu được tổ chức code và tài liệu.

> **Kiến trúc:** Module-based Architecture - Tổ chức code theo tính năng/domain thay vì theo loại file.

---

## 📋 TL;DR - Tổng quan Nhanh

```
vaultrs/
├── 📂 desktop/         # 🖥️ Desktop App (Tauri + React)
│   ├── 📂 src/         # Frontend React - Module-based
│   └── 📂 src-tauri/   # Backend Rust (Tauri) - Module-based
├── 📂 docs/            # 📚 Tài liệu dự án
├── 📂 .github/         # GitHub workflows & templates
└── 📄 README.md        # Giới thiệu dự án
```

**💡 Nguyên tắc Module-based:**

-   Mỗi module chứa tất cả code liên quan đến một tính năng
-   Dễ dàng navigate, scale và maintain
-   Module độc lập, giảm coupling

---

## 1. 📂 Thư mục Root

### Cấu trúc Tổng quan

```
vaultrs/
├── .git/                    # Git metadata
├── .github/                 # GitHub workflows & templates
│   └── ...
├── .gitignore               # Files bỏ qua bởi Git
├── .vscode/                 # VS Code settings
├── .obsidian/               # Obsidian settings (cho docs)
│
├── desktop/                 # 🖥️ Desktop Application
│   ├── src/                 # ⚛️ Frontend React
│   ├── src-tauri/           # 🦀 Backend Rust (Tauri)
│   ├── public/              # Static assets
│   ├── package.json         # Node config & scripts
│   ├── pnpm-lock.yaml       # Lock file (pnpm)
│   ├── vite.config.ts       # Vite bundler config (Tailwind v4 via plugin)
│   ├── tsconfig.json        # TypeScript config
│   ├── .eslintrc.cjs        # ESLint config
│   └── components.json      # shadcn/ui config
│
├── docs/                    # 📚 Tài liệu dự án
│   └── ...
│
├── README.md                # Giới thiệu dự án
├── CHANGELOG.md             # Lịch sử thay đổi
├── CONTRIBUTING.md          # Hướng dẫn đóng góp
└── CODE_OF_CONDUCT.md       # Quy tắc ứng xử
```

### Mô tả Các Thư mục & File Quan trọng

| Đường dẫn                      | Mục đích                                 |
| ------------------------------ | ---------------------------------------- |
| `desktop/`                     | Chứa toàn bộ Tauri desktop app           |
| `desktop/package.json`         | Quản lý dependencies và scripts frontend |
| `desktop/src-tauri/Cargo.toml` | Quản lý dependencies Rust                |
| `desktop/vite.config.ts`       | Cấu hình bundler Vite (bao gồm Tailwind v4 plugin) |
| `desktop/tsconfig.json`        | Cấu hình TypeScript                      |
| `docs/`                        | Tài liệu kỹ thuật dự án                  |

---

## 2. 📚 Thư mục `docs/`

Tài liệu dự án được tổ chức theo số thứ tự ưu tiên và loại nội dung.

```
docs/
├── 00-meta/                 # Meta docs (hướng dẫn viết docs)
│   ├── 1-folder-structure.md    # 📁 File này
│   ├── 2-naming-convention.md   # 📝 Quy ước đặt tên
│   ├── 3-how-to-document.md     # 📘 Cách viết tài liệu
│   ├── 4-glossary.md            # 📖 Từ điển thuật ngữ
│   ├── 5-versioning.md          # 🏷️ Quy ước versioning
│   └── 6-docs-index.md          # 📚 Mục lục tài liệu
│
├── 01-architecture/         # Kiến trúc hệ thống
│   ├── 1-overview.md            # Tổng quan kiến trúc
│   ├── 2-system-design.md       # Thiết kế hệ thống chi tiết
│   └── 3-tech-stack.md          # Công nghệ sử dụng
│
├── 02-database/             # Database & storage
│   ├── 1-overview.md            # Tổng quan database
│   ├── 2-schema.md              # Schema chi tiết
│   ├── 3-indexes.md             # Indexes & performance
│   ├── 4-queries.md             # Queries
│   ├── 5-migrations.md          # Migrations
│   ├── 6-backup.md              # Backup & recovery
│   └── 7-field-data-handling.md # JSON properties format
│
├── 03-backend-rust/         # Tài liệu Backend Rust (chưa viết)
├── 04-frontend-react/       # Tài liệu Frontend React (chưa viết)
│
└── 99-dev-notes/            # Ghi chép developer
    └── idea.md              # Ý tưởng & features mới
```

### Quy tắc Đánh số Thư mục

| Prefix | Ý nghĩa                               |
| ------ | ------------------------------------- |
| `00-`  | Meta (tài liệu về tài liệu)           |
| `01-`  | Kiến trúc tổng quan                   |
| `02-`  | Database & data layer                 |
| `03-`  | Backend Rust                          |
| `04-`  | Frontend React                        |
| `99-`  | Dev notes (ý tưởng, debug, temporary) |

> 💡 **Tip:** Prefix số giúp các thư mục tự động sắp xếp theo thứ tự đọc hợp lý.

---

## 3. 🦀 Thư mục `desktop/src-tauri/` (Backend Rust)

Backend Rust sử dụng Tauri framework, tổ chức theo **Module-based Architecture**.

```
desktop/src-tauri/
├── Cargo.toml               # Dependencies Rust
├── Cargo.lock               # Lock file
├── tauri.conf.json          # Cấu hình Tauri
├── build.rs                 # Build script
├── icons/                   # App icons
│   └── *.png, *.ico
│
└── src/
    ├── main.rs              # Entry point
    ├── lib.rs               # Library root - khai báo modules
    │
    ├── core/                # 🔧 Core utilities (shared across modules)
    │   ├── mod.rs
    │   ├── error.rs         # Custom error types
    │   ├── result.rs        # Result type aliases
    │   └── config.rs        # App configuration
    │
    ├── db/                  # 💾 Database connection & migrations
    │   ├── mod.rs
    │   ├── connection.rs    # SQLite connection (WAL mode)
    │   └── migrations/      # SeaORM migration files
    │
    ├── collections/         # 📂 Module: Collection Management
    │   ├── mod.rs           # Module root
    │   ├── commands.rs      # Tauri commands (CRUD collections)
    │   ├── service.rs       # Business logic
    │   ├── models.rs        # Collection entity & DTOs
    │   └── tests.rs         # Unit tests
    │
    ├── items/               # 📝 Module: Item Management
    │   ├── mod.rs           # Module root
    │   ├── commands.rs      # Tauri commands (CRUD items)
    │   ├── service.rs       # Business logic
    │   ├── models.rs        # Item entity & DTOs
    │   └── tests.rs         # Unit tests
    │
    ├── custom_fields/       # 🏷️ Module: Attribute Definitions
    │   ├── mod.rs           # Module root
    │   ├── commands.rs      # Tauri commands (field CRUD)
    │   ├── service.rs       # EAV engine — field definitions & typed values
    │   ├── models.rs        # Attribute entity & field types
    │   └── tests.rs         # Unit tests
    │
    ├── relations/           # 🔗 Module: Cross-Collection Links
    │   ├── mod.rs
    │   ├── service.rs       # Reference field resolution
    │   └── models.rs        # Relation models
    │
    └── search/              # 🔍 Module: Full-Text Search
        ├── mod.rs
        ├── commands.rs      # Tauri commands (search)
        ├── service.rs       # FTS5 indexing & query coordination
        └── tests.rs         # Unit tests
```

### Module Structure Pattern

Mỗi module tuân theo cấu trúc chuẩn:

```
module_name/
├── mod.rs           # Module root - exports public API
├── commands.rs      # Tauri commands (API cho frontend)
├── service.rs       # Business logic layer
├── models.rs        # Data structures & DTOs
├── storage.rs       # Persistence (nếu cần)
└── tests.rs         # Unit tests
```

### Module Dependencies

```
┌─────────────────────────────────────────────────────┐
│                    main.rs                          │
│                  (Entry Point)                      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                     lib.rs                          │
│              (Module Registration)                   │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌───────────┐
    │  core   │    │ crypto  │    │  shared   │
    │ (utils) │    │ (crypto)│    │ utilities │
    └─────────┘    └─────────┘    └───────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         ▼               ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────────┐
    │  auth   │    │  vault  │    │  entry  │    │ generator │
    │ module  │◄───│ module  │───►│ module  │    │  module   │
    └─────────┘    └─────────┘    └─────────┘    └───────────┘
```

### Ví dụ Module: `vault/`

```rust
// desktop/src-tauri/src/vault/mod.rs
pub mod commands;
pub mod service;
pub mod models;
pub mod storage;

#[cfg(test)]
mod tests;

// Re-export public API
pub use commands::*;
pub use models::{Vault, VaultConfig};
```

```rust
// desktop/src-tauri/src/vault/commands.rs
use super::service::VaultService;
use super::models::*;

#[tauri::command]
pub async fn create_vault(config: VaultConfig) -> Result<Vault, String> {
    VaultService::create(config).await
}

#[tauri::command]
pub async fn unlock_vault(path: String, password: String) -> Result<Vault, String> {
    VaultService::unlock(&path, &password).await
}
```

---

## 4. ⚛️ Thư mục `desktop/src/` (Frontend React)

Frontend React với TypeScript, tổ chức theo **Module-based Architecture**.

```
desktop/src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component & routing
├── index.css                # Global styles & design tokens
├── vite-env.d.ts            # Vite type definitions
│
├── core/                    # 🔧 Core utilities (shared)
│   ├── api/                 # Tauri API wrapper
│   │   ├── index.ts
│   │   └── tauri.ts         # invoke wrapper
│   ├── hooks/               # Shared hooks
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── types/               # Shared types
│   │   └── common.ts
│   └── utils/               # Shared utilities
│       ├── validation.ts
│       └── formatting.ts
│
├── components/              # 🧩 Shared UI Components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.css
│   │   └── index.ts
│   ├── Input/
│   ├── Modal/
│   ├── Card/
│   ├── Toast/
│   └── Layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
│
├── modules/                 # 📦 Feature Modules
│   │
│   ├── auth/                # 🔑 Module: Authentication
│   │   ├── components/      # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── UnlockScreen.tsx
│   │   │   └── MasterPasswordInput.tsx
│   │   ├── hooks/           # Auth-specific hooks
│   │   │   └── useAuth.ts
│   │   ├── services/        # Auth API calls
│   │   │   └── authService.ts
│   │   ├── types/           # Auth types
│   │   │   └── auth.types.ts
│   │   ├── context/         # Auth context (if needed)
│   │   │   └── AuthContext.tsx
│   │   └── index.ts         # Public exports
│   │
│   ├── vault/               # 🗄️ Module: Vault Management
│   │   ├── components/
│   │   │   ├── VaultList.tsx
│   │   │   ├── VaultCard.tsx
│   │   │   ├── CreateVaultModal.tsx
│   │   │   └── VaultSettings.tsx
│   │   ├── hooks/
│   │   │   └── useVault.ts
│   │   ├── services/
│   │   │   └── vaultService.ts
│   │   ├── types/
│   │   │   └── vault.types.ts
│   │   ├── context/
│   │   │   └── VaultContext.tsx
│   │   └── index.ts
│   │
│   ├── entry/               # 📝 Module: Password Entries
│   │   ├── components/
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   ├── EntryForm.tsx
│   │   │   ├── EntryDetails.tsx
│   │   │   └── CategoryFilter.tsx
│   │   ├── hooks/
│   │   │   ├── useEntries.ts
│   │   │   └── useSearch.ts
│   │   ├── services/
│   │   │   └── entryService.ts
│   │   ├── types/
│   │   │   └── entry.types.ts
│   │   └── index.ts
│   │
│   └── generator/           # 🎲 Module: Password Generator
│       ├── components/
│       │   ├── PasswordGenerator.tsx
│       │   ├── StrengthMeter.tsx
│       │   ├── GeneratorOptions.tsx
│       │   └── PasswordDisplay.tsx
│       ├── hooks/
│       │   └── useGenerator.ts
│       ├── services/
│       │   └── generatorService.ts
│       ├── types/
│       │   └── generator.types.ts
│       └── index.ts
│
├── pages/                   # 📄 Page components (routes)
│   ├── HomePage.tsx
│   ├── VaultPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
│
├── router/                  # 🔀 Routing configuration
│   ├── index.tsx
│   └── routes.ts
│
├── store/                   # 🗃️ Global state (nếu cần)
│   ├── index.ts
│   └── slices/
│       └── appSlice.ts
│
├── theme/                   # 🎨 Theme & styling
│   ├── colors.ts
│   ├── typography.ts
│   └── ThemeContext.tsx
│
└── assets/                  # 🖼️ Static assets
    ├── images/
    ├── fonts/
    └── icons/
```

### Module Structure Pattern (Frontend)

Mỗi module tuân theo cấu trúc chuẩn:

```
module_name/
├── components/          # UI components cho module
│   ├── ComponentA.tsx
│   └── ComponentB.tsx
├── hooks/               # Custom hooks
│   └── useModuleName.ts
├── services/            # API calls & business logic
│   └── moduleService.ts
├── types/               # TypeScript types
│   └── module.types.ts
├── context/             # React context (optional)
│   └── ModuleContext.tsx
└── index.ts             # Public exports
```

### Ví dụ Module: `entry/`

```typescript
// desktop/src/modules/entry/index.ts
// Public API của module
export { EntryList } from "./components/EntryList";
export { EntryCard } from "./components/EntryCard";
export { EntryForm } from "./components/EntryForm";
export { useEntries } from "./hooks/useEntries";
export { entryService } from "./services/entryService";
export type { Entry, EntryFormData } from "./types/entry.types";
```

```typescript
// Sử dụng trong page
import { EntryList, useEntries } from "@/modules/entry";
import { VaultContext } from "@/modules/vault";

function VaultPage() {
    const vault = useContext(VaultContext);
    const { entries, loading } = useEntries(vault.id);

    return <EntryList entries={entries} loading={loading} />;
}
```

---

## 5. 📂 Thư mục `desktop/public/`

Static assets được serve trực tiếp.

```
desktop/public/
├── favicon.ico              # Tab icon
├── robots.txt               # SEO (nếu web)
└── assets/                  # Public assets
    └── logo.svg
```

---

## 6. 🔧 Conventions

### 6.1 Đặt tên File

| Loại             | Convention               | Ví dụ                 |
| ---------------- | ------------------------ | --------------------- |
| Rust module      | `snake_case.rs`          | `vault_service.rs`    |
| Rust module dir  | `snake_case/`            | `vault/`, `auth/`     |
| React component  | `PascalCase.tsx`         | `EntryList.tsx`       |
| React module dir | `camelCase/` or `kebab/` | `entry/`, `vault/`    |
| Hook             | `useCamelCase.ts`        | `useEntries.ts`       |
| Service          | `camelCaseService.ts`    | `entryService.ts`     |
| Types            | `name.types.ts`          | `entry.types.ts`      |
| Documentation    | `kebab-case.md`          | `folder-structure.md` |

### 6.2 Module Export Pattern

```typescript
// module/index.ts - Clean public API
// Components
export { ComponentA } from "./components/ComponentA";
export { ComponentB } from "./components/ComponentB";

// Hooks
export { useModuleHook } from "./hooks/useModuleHook";

// Services
export { moduleService } from "./services/moduleService";

// Types
export type { TypeA, TypeB } from "./types/module.types";
```

### 6.3 Import Order

```tsx
// 1. React & external imports
import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

// 2. Core/shared imports
import { Button, Modal } from "@/components";
import { useDebounce } from "@/core/hooks";

// 3. Module imports
import { useVault, VaultContext } from "@/modules/vault";
import { EntryCard, entryService } from "@/modules/entry";

// 4. Local/relative imports
import { LocalComponent } from "./LocalComponent";

// 5. Types
import type { Entry } from "@/modules/entry";

// 6. Styles
import "./ComponentName.css";
```

### 6.4 Module Communication

```
┌─────────────────────────────────────────────────────────┐
│                     App.tsx                             │
│                   (Root Component)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Global Context                        │
│          (Theme, App Settings, User Preferences)        │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  Auth   │      │  Vault  │      │ Entry   │
    │ Context │ ───► │ Context │ ───► │ (deps)  │
    └─────────┘      └─────────┘      └─────────┘

Quy tắc:
• Module có thể import từ core/components (shared)
• Module có thể import types từ module khác
• Module KHÔNG import components từ module khác trực tiếp
• Sử dụng Context hoặc Props để share state giữa modules
```

---

## 7. 🚀 Scripts & Commands

### Desktop App Scripts (từ thư mục `desktop/`)

```bash
cd desktop

# Frontend + Tauri development
pnpm run dev          # Start dev server (frontend + Tauri)
pnpm run build        # Build production
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint

# Tauri specific
pnpm tauri dev        # Start Tauri development
pnpm tauri build      # Build Tauri production app
```

### Cargo Commands (từ thư mục `desktop/src-tauri/`)

```bash
cd desktop/src-tauri

cargo build          # Build Rust backend
cargo test           # Run Rust tests
cargo clippy         # Lint Rust code
cargo fmt            # Format Rust code
```

---

## 8. 📝 Best Practices

### ✅ Nên làm

-   **Tổ chức theo module/feature**, không phải theo loại file
-   Mỗi module có **public API rõ ràng** qua `index.ts`/`mod.rs`
-   **Shared code** đặt trong `core/` hoặc `components/`
-   Giữ **module độc lập**, giảm dependencies giữa các module
-   Đặt **tests cùng với code** (`component.test.tsx`, `tests.rs`)
-   Cập nhật docs khi thêm/xóa module

### ❌ Không nên

-   Tạo thư mục theo loại (`hooks/`, `services/`) ở root level
-   Import private/internal code từ module khác
-   Để module phụ thuộc circular vào nhau
-   Tạo "god" modules với quá nhiều responsibilities
-   Import với đường dẫn sâu (`../../../modules/vault/components`)

---

## 9. 🔄 Migration từ Layer-based sang Module-based

Nếu bạn đang có codebase layer-based, đây là cách migrate:

### Before (Layer-based)

```
desktop/src/
├── components/
│   ├── VaultList.tsx
│   ├── EntryCard.tsx
│   └── LoginForm.tsx
├── hooks/
│   ├── useVault.ts
│   └── useAuth.ts
└── services/
    ├── vaultService.ts
    └── authService.ts
```

### After (Module-based)

```
desktop/src/
├── modules/
│   ├── vault/
│   │   ├── components/VaultList.tsx
│   │   ├── hooks/useVault.ts
│   │   └── services/vaultService.ts
│   ├── entry/
│   │   └── components/EntryCard.tsx
│   └── auth/
│       ├── components/LoginForm.tsx
│       ├── hooks/useAuth.ts
│       └── services/authService.ts
└── components/        # Chỉ giữ shared components
    ├── Button.tsx
    └── Modal.tsx
```

---

## 🔗 Tài liệu Liên quan

-   [Quy ước đặt tên](./2-naming-convention.md)
-   [Hướng dẫn viết docs](./3-how-to-document.md)

---

_Cập nhật: 2026-07-16_
