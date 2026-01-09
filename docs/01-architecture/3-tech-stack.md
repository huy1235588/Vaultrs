# 🛠️ Tech Stack - Vaultrs

> **Mục tiêu:** Tài liệu về các công nghệ được sử dụng trong dự án Vaultrs.

---

## 📋 TL;DR

| Layer        | Technology       | Version | Purpose                   |
| ------------ | ---------------- | ------- | ------------------------- |
| **Desktop**  | Tauri            | v2      | Native desktop framework  |
| **UI**       | React            | 18+     | Component-based UI        |
| **Language** | TypeScript       | 5+      | Type-safe frontend        |
| **Build**    | Vite             | 5+      | Fast bundler              |
| **Backend**  | Rust             | 1.70+   | System programming        |
| **Async**    | Tokio            | 1.x     | Async runtime             |
| **ORM**      | SeaORM           | 0.12+   | Async database ORM        |
| **Database** | SQLite           | -       | Embedded database         |
| **UI Kit**   | Shadcn UI        | -       | Accessible components     |
| **Styling**  | Tailwind CSS     | 3+      | Utility-first CSS         |
| **Grid**     | TanStack Table   | 8+      | Headless table logic      |
| **Virtual**  | TanStack Virtual | 3+      | Virtual scrolling         |

---

## 1. 🖥️ Tauri v2 (Desktop Framework)

### Tauri vs Electron

| Tiêu chí        | Tauri      | Electron    |
| --------------- | ---------- | ----------- |
| Binary Size     | ~8 MB      | ~150 MB     |
| Memory Usage    | ~50 MB     | ~200 MB+    |
| Startup Time    | Nhanh      | Chậm        |
| Security        | Tốt hơn    | Kém hơn     |
| Backend         | Rust       | JavaScript  |

### Key Features

- **Commands**: Type-safe IPC
- **State Management**: Managed app state
- **Events**: Backend → Frontend communication
- **File System**: Native file access

---

## 2. ⚛️ Frontend Stack

### React 18 + TypeScript + Vite

```typescript
// Modern React with TypeScript
import { useState, useEffect } from 'react';

interface Item {
  id: number;
  title: string;
}

const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  // ...
}
```

### Shadcn UI + Tailwind CSS

- **Shadcn**: Copy-paste components, full customization
- **Tailwind**: Utility-first styling, dark mode ready

### TanStack (Table + Virtual)

- **Table**: Headless table logic
- **Virtual**: Render 10M+ rows efficiently

```typescript
const virtualizer = useVirtualizer({
  count: 10_000_000,
  estimateSize: () => 50,
  overscan: 5,
});
```

---

## 3. 🦀 Backend Stack

### Rust + Tokio

```rust
#[tauri::command]
async fn get_items(
    state: State<'_, AppState>,
) -> Result<Vec<Item>, String> {
    state.service.get_items().await
}
```

### SeaORM + SQLite

```rust
#[derive(Clone, Debug, DeriveEntityModel)]
#[sea_orm(table_name = "items")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub title: String,
    pub properties: Option<Json>,
}
```

---

## 4. 📦 Development

### Commands

```bash
# Development
pnpm run dev

# Build
pnpm tauri build
```

### VS Code Extensions

- `rust-analyzer`
- `bradlc.vscode-tailwindcss`
- `tauri-apps.tauri-vscode`

---

## 🔗 Tài liệu Liên quan

- [Kiến trúc Tổng quan](./1-overview.md)
- [Thiết kế Hệ thống](./2-system-design.md)
- [Data Flow](./4-data-flow.md)

---

_Cập nhật: 2026-01-08_
