# 🛠️ Tech Stack - Vaultrs

> **Mục tiêu:** Tài liệu về các công nghệ được sử dụng trong dự án Vaultrs.
>
> ⚠️ **Cập nhật 2026-07-15:** Bảng version bên dưới đã được rà soát lại theo phiên bản mới nhất tại thời điểm cập nhật. Một số công nghệ có thay đổi kiến trúc đáng chú ý (TypeScript 7, Tailwind CSS 4, Vite 8) — xem ghi chú "Điều gì thay đổi" ở mỗi mục trước khi upgrade.

---

## 📋 TL;DR

| Layer        | Technology       | Version (07/2026)     | Purpose                       |
| ------------ | ---------------- | ---------------------- | ------------------------------ |
| **Desktop**  | Tauri            | v2.11.x                | Native desktop framework       |
| **UI**       | React            | 19.2.x                 | Component-based UI             |
| **Language** | TypeScript       | 7.0.x (native/Go)      | Type-safe frontend             |
| **Build**    | Vite             | 8.1.x                  | Fast bundler (Rolldown/Oxc)    |
| **Backend**  | Rust             | stable (≥ 1.80 khuyến nghị) | System programming        |
| **Async**    | Tokio            | 1.x                    | Async runtime                  |
| **ORM**      | SeaORM           | 2.0                    | Async database ORM             |
| **Database** | SQLite           | 3.53.x                 | Embedded database              |
| **UI Kit**   | shadcn/ui        | CLI v4                 | Accessible components          |
| **Styling**  | Tailwind CSS     | 4.3.x                  | Utility-first CSS (CSS-first config) |
| **Data Grid**| TanStack Table   | v9                     | Headless table logic           |
| **Virtual**  | TanStack Virtual | latest (bản 2026)      | Virtual scrolling (List / Grid)|

> 📌 Vaultrs hiện chưa pin version cụ thể trong `Cargo.toml`/`package.json` — bảng trên là bản mới nhất tồn tại trên registry, dùng làm target khi thiết lập dự án mới hoặc upgrade. Luôn khóa version cụ thể (không dùng `latest`/`*`) khi thực sự cài đặt.

---

## 1. 🖥️ Tauri v2 (Desktop Framework)

Vẫn ở major **v2** (bản ổn định phát hành 10/2024), phiên bản mới nhất trong dòng v2 là **2.11.x** (2.11.5, phát hành 01/07/2026) — chỉ là các bản vá/minor, không có breaking change lớn so với thời điểm README được viết.

### Tauri vs Electron

| Tiêu chí     | Tauri   | Electron   |
| ------------ | ------- | ---------- |
| Binary Size  | ~8 MB   | ~150 MB    |
| Memory Usage | ~50 MB  | ~200 MB+   |
| Startup Time | Nhanh   | Chậm       |
| Security     | Tốt hơn | Kém hơn    |
| Backend      | Rust    | JavaScript |

### Key Features

-   **Commands**: Type-safe IPC
-   **State Management**: Managed app state
-   **Events**: Backend → Frontend communication
-   **File System**: Native file access

---

## 2. ⚛️ Frontend Stack

### React 19 + TypeScript 7 + Vite 8

**Điều gì thay đổi:**

-   **React 18 → 19.2.x**: React 19 đã GA từ cuối 2024 và ổn định cho production suốt năm 2026. Đáng chú ý cho Vaultrs (dù không dùng Server Components vì là desktop app thuần client):
    -   `ref` truyền như một prop bình thường — không cần `forwardRef` nữa cho component mới.
    -   **React Compiler** (ổn định từ 10/2025) tự động memoize, giảm nhu cầu gọi thủ công `useMemo`/`useCallback` — rất hợp với các bảng 10M dòng.
    -   `useActionState`, `useTransition` hỗ trợ async actions cho form (tạo/sửa Collection, Item).
    -   `Activity` component (React 19.2) — giữ state phần UI ẩn (ví dụ tab Collection chưa active) mà không unmount, hữu ích khi có nhiều Collection mở song song.
-   **TypeScript 5+/6 → 7.0.x**: TypeScript 7 (biệt danh dự án "Corsa") là bản build lại native bằng Go, GA ngày 08/07/2026, nhanh hơn ~10x so với 6.0. Lưu ý khi upgrade:
    -   Kế thừa các default "strict" từ 6.0: `strict` mode, ESM module resolution, target `es2025` — cần rà lại `tsconfig.json` hiện tại nếu đang dùng `target: es5` hoặc `moduleResolution: node` (đã bị loại bỏ).
    -   API lập trình (dùng bởi `typescript-eslint`, `ts-morph`, transformer tuỳ biến) **chưa ổn định tới bản 7.1** — nếu Vaultrs có dùng plugin ESLint tuỳ biến, giữ `typescript` ở 6.0 cho riêng phần tooling đó cho tới khi 7.1 ra mắt.
-   **Vite 5+ → 8.1.x**: Vite 7 (giữa 2025) và Vite 8 (cuối 2025) chuyển bundler mặc định từ esbuild/Rollup sang **Rolldown + Oxc** (viết bằng Rust), cải thiện tốc độ dev server/build đáng kể. Yêu cầu Node.js ≥ 20.19 hoặc ≥ 22.12.

```typescript
// Modern React 19 + TypeScript 7
import { useState } from "react";

interface Item {
    id: number;
    title: string;
}

function ItemList() {
    const [items, setItems] = useState<Item[]>([]);
    // React Compiler tự động tối ưu re-render, không cần useMemo/useCallback thủ công
    return <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
}

export default ItemList;
```

### shadcn/ui + Tailwind CSS 4

**Điều gì thay đổi:** Tailwind CSS đã lên **v4.3.x**, một bản viết lại kiến trúc so với v3 mà tài liệu cũ (`3+`) đang mô tả:

-   Cấu hình **CSS-first**: không còn `tailwind.config.js` — khai báo design tokens bằng `@theme` ngay trong file CSS.
-   Dùng plugin `@tailwindcss/vite` chính thức thay vì cấu hình PostCSS thủ công.
-   Màu mặc định chuyển sang **OKLCH**; có thêm các utility cho logical properties (hỗ trợ RTL/đa ngôn ngữ) — không thật sự cần cho Vaultrs nhưng tốt để biết.
-   **shadcn/ui** cũng nâng CLI lên **v4** (03/2026): hỗ trợ chọn primitive nền (Radix UI hoặc Base UI), preset cấu hình đóng gói theme/màu/font, và có "shadcn/skills" giúp AI coding agent hiểu đúng component đã cài.

```bash
# Cài Tailwind v4 cho Vite
npm install -D tailwindcss @tailwindcss/vite

# Khởi tạo shadcn/ui (CLI v4)
pnpm dlx shadcn@latest init -t vite
```

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
});
```

> Nếu Vaultrs vẫn đang ở Tailwind v3, cần chạy qua migration guide chính thức trước khi nâng — đây là breaking change thật sự, không chỉ là version bump.

### TanStack (Table v9 + Virtual)

-   **TanStack Table**: quản lý logic headless cho dạng bảng (List Mode) và điều phối trạng thái phân trang (Pagination).
-   **TanStack Virtual**: giải pháp ảo hóa bắt buộc (luôn bật) để hiển thị danh sách hàng triệu records. Thư viện này hỗ trợ tối ưu cả cuộn dọc 1 chiều cho List Mode (Table) lẫn cuộn đa cột cho Grid Mode. Các bản 2026 tập trung tối ưu hiệu năng — cold mount ở 100k dòng nhanh hơn ~5x, sửa lỗi cuộn quán tính trên iOS Safari.

```typescript
// Ví dụ ảo hóa 1 chiều cho List Mode (Table)
const rowVirtualizer = useVirtualizer({
    count: 10_000_000,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
});

// Ví dụ ảo hóa đa cột cho Grid Mode (dựa trên cột đã chia)
const gridVirtualizer = useVirtualizer({
    count: Math.ceil(10_000_000 / columnsCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Chiều cao hàng Grid
    overscan: 3,
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

### SeaORM 2.0 + SQLite 3.53

**Điều gì thay đổi:** SeaORM đã ra bản **2.0 ổn định** (01/2026, thay cho dòng `0.12+` cũ) — về cơ bản tương thích ngược, migration là "tìm & thay" cơ học, nhưng có vài điểm đáng cân nhắc cho Vaultrs:

-   **Entity First Workflow (mới)**: có thể định nghĩa entity trước, để SeaORM tự phát hiện và tạo bảng/cột/khóa — là hướng thay thế cho quy trình migration thủ công đang mô tả ở [5-migrations.md](../02-database/5-migrations.md). Vaultrs nên **giữ migration thủ công** (đã dùng `sea-orm-cli migrate`) vì cần kiểm soát chặt schema cho dataset 10M+ dòng, nhưng nên biết tùy chọn này tồn tại.
-   Query builder nhanh hơn ~20%, giảm copy nội bộ — có lợi trực tiếp cho các query paginate/filter lớn.
-   Panic đã được loại khỏi API surface, error handling rõ ràng hơn.
-   Hỗ trợ xuất/nhập Arrow & Parquet (mới, 02/2026) — có thể hữu ích cho tính năng export sau này.

-   **SQLite** lên **3.53.3** (26/06/2026). Đáng chú ý: bản 3.53.0 sửa một lỗi hỏng dữ liệu liên quan đến **WAL-reset** đã tồn tại nhiều năm — vì Vaultrs dùng WAL mode làm trọng tâm hiệu năng, nên **khuyến nghị pin tối thiểu SQLite ≥ 3.53.0** khi build.

```rust
// SeaORM 2.0 — cú pháp entity không đổi nhiều so với 1.x/0.12.x
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
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

-   `rust-analyzer`
-   `bradlc.vscode-tailwindcss`
-   `tauri-apps.tauri-vscode`

---

## 5. 🔄 Ghi chú Nâng cấp (Upgrade Notes)

| Thay đổi                          | Mức độ ảnh hưởng | Hành động đề xuất |
| ---------------------------------- | ----------------- | ------------------ |
| TypeScript 7 (native compiler)     | 🟡 Trung bình      | Rà `tsconfig.json` theo default mới (strict/ESM/es2025); giữ TS 6.0 riêng cho tool chưa hỗ trợ API 7.x |
| Tailwind CSS v3 → v4                | 🔴 Cao (breaking)  | Chạy upgrade tool chính thức, chuyển `tailwind.config.js` sang `@theme` trong CSS |
| Vite 5 → 8                          | 🟡 Trung bình      | Kiểm tra plugin bên thứ 3 đã hỗ trợ Rolldown/Oxc chưa; nâng Node.js lên ≥ 20.19 |
| SeaORM 0.12 → 2.0                   | 🟢 Thấp            | Chủ yếu tìm & thay theo migration guide chính thức; không bắt buộc đổi sang Entity First |
| SQLite → 3.53.x                     | 🟢 Thấp (nên làm)  | Nâng lên tối thiểu 3.53.0 để có bản vá lỗi WAL-reset |
| React 18 → 19.2                     | 🟡 Trung bình      | Chạy codemod chính thức, bỏ dần `forwardRef` không cần thiết |
| TanStack Table v8 → v9              | 🟢 Thấp            | API cốt lõi ổn định, chủ yếu là bản vá + tính năng agent-skills mới |

---

## 🔗 Tài liệu Liên quan

-   [Kiến trúc Tổng quan](./1-overview.md)
-   [Thiết kế Hệ thống](./2-system-design.md)

---

_Cập nhật: 2026-07-15_
