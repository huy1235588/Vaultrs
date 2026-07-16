# Walkthrough — Khởi tạo dự án Vaultrs

Dự án Vaultrs đã được khởi tạo thành công với cấu trúc và cấu hình hoàn chỉnh theo tài liệu kiến trúc.

---

## 📁 Cấu trúc Thư mục Đã Tạo

```
vaultrs/
└── desktop/
    ├── src/                 # Giao diện React
    │   ├── core/            # Tauri API wrapper và các kiểu dữ liệu chung
    │   ├── components/      # layout, button, input, dialog
    │   ├── pages/           # Trang chủ (HomePage)
    │   ├── lib/             # cn utility
    │   ├── App.tsx          # Root Component
    │   ├── index.css        # Tailwind 4 configuration
    │   └── main.tsx         # Entrypoint
    │
    ├── src-tauri/           # Backend Rust (Tauri)
    │   ├── src/
    │   │   ├── core/        # error, result, config
    │   │   ├── db/          # WAL connection, schema migrations
    │   │   ├── collections/ # collection CRUD commands & service
    │   │   ├── items/       # item CRUD commands & service
    │   │   ├── custom_fields/# custom fields CRUD commands & service
    │   │   ├── lib.rs       # module registration & tauri setup
    │   │   └── main.rs
    │   ├── Cargo.toml
    │   └── tauri.conf.json
    │
    ├── components.json      # shadcn configuration
    └── package.json         # frontend package dependencies
```

---

## 💾 Cấu trúc Database SQLite & Triggers

Toàn bộ database schema đã được tạo lập qua 3 migrations chạy tự động khi khởi động app:
1. `collections` table với index trên `slug` và trigger `update_collections_updated_at`.
2. `attributes` (custom fields) table chứa config cho dynamic EAV properties, kèm khóa ngoại cascading.
3. `items` table (sẵn sàng cho 10M+ records) với:
   - Các index tối ưu hiệu năng: `collection_id`, `created_at`, `updated_at`, `collection_id` + `created_at`.
   - Index không phân biệt chữ hoa/thường: `idx_items_title` sử dụng `NOCASE`.
   - Bảng ảo Full-text Search `items_fts` dùng **FTS5** cùng các triggers đồng bộ hóa dữ liệu tự động (`insert`, `delete`, `update`).

---

## 🛠️ Kết Quả Kiểm Tra (Verification)

1. **Rust Compile & DB Init**:
   - `cargo check` compile hoàn thành không lỗi.
   - Thử nghiệm chạy database tự tạo file `vaultrs.db` tại `%APPDATA%\com.huy1235588.vaultrs\`, cấu hình thành công các Pragmas tối ưu:
     - `journal_mode = WAL`
     - `synchronous = NORMAL`
     - `foreign_keys = ON`
     - Chạy hoàn thành tất cả 3 migrations và in ra: `[vaultrs_lib] [INFO] Vaultrs initialized successfully`.

2. **Frontend Compile**:
   - Build Vite client environment thành công (`dist/` output) trong **797ms** mà không có lỗi.
   - Hoàn thành cài đặt Tailwind v4 và tích hợp shadcn base components (`button`, `input`, `dialog`).
