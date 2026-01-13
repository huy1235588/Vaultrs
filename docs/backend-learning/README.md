# 🦀 Hướng dẫn Học Backend Rust cho Vaultrs

> [!NOTE]
> Tài liệu này được viết cho những người mới bắt đầu với Rust, giúp bạn hiểu và có thể code phần backend của dự án Vaultrs.

**Tác giả**: GitHub Copilot  
**Cập nhật**: Tháng 1, 2026  
**Thời gian học**: ~4 tuần (2-3 giờ/ngày)

---

## 📚 Mục Lục

| #   | Tài liệu                                    | Thời gian | Mô tả                                         |
| --- | ------------------------------------------- | --------- | --------------------------------------------- |
| 1   | [Giới thiệu](./01-introduction.md)          | 5 phút    | Tổng quan Vaultrs và lý do dùng Rust          |
| 2   | [Rust Basics](./02-rust-basics.md)          | 30 phút   | Variables, Ownership, Pattern Matching, Async |
| 3   | [Cấu trúc Dự án](./03-project-structure.md) | 15 phút   | Folder structure và Module system             |
| 4   | [Kiến trúc 3 Layers](./04-architecture.md)  | 20 phút   | Commands → Services → Database                |
| 5   | [Tauri Commands](./05-tauri-commands.md)    | 15 phút   | IPC, State Management, Registering            |
| 6   | [Database & ORM](./06-database-orm.md)      | 20 phút   | SQLite, SeaORM, CRUD operations               |
| 7   | [Error Handling](./07-error-handling.md)    | 15 phút   | Custom errors, Result, ? operator             |
| 8   | [Coding Examples](./08-examples.md)         | 30 phút   | Full examples: Create, List, Update Vault     |
| 9   | [Roadmap Học Tập](./09-roadmap.md)          | -         | Lộ trình 4 tuần chi tiết                      |
| 10  | [Tài liệu Tham khảo](./10-references.md)    | -         | Links hữu ích                                 |

---

## 🚀 Quick Start

### Điều kiện tiên quyết

```bash
# Kiểm tra Rust đã cài chưa
rustc --version   # rust 1.75+
cargo --version   # cargo 1.75+

# Nếu chưa có, cài từ https://rustup.rs/
```

### Chạy dự án

```bash
# Clone repo (nếu chưa có)
git clone <repo-url>
cd Vaultrs

# Chạy development mode
cd desktop
npm install
npm run tauri dev
```

---

## 🏗️ Kiến trúc Tổng quan

```
┌─────────────────────────────────────────┐
│      Desktop App (React Frontend)       │
│  • Giao diện người dùng                 │
│  • Virtual scrolling cho 10M+ rows      │
└──────────────┬──────────────────────────┘
               │ IPC (Inter-Process Communication)
┌──────────────▼──────────────────────────┐
│      Backend (Rust + Tauri)             │
│  • Xử lý logic business                 │
│  • Database access                      │
└──────────────┬──────────────────────────┘
               │ SQL Commands
┌──────────────▼──────────────────────────┐
│   SQLite Database (1 file duy nhất)     │
│  • Lưu Vaults, Entries, Attributes      │
└─────────────────────────────────────────┘
```

---

## 📖 Cách Sử Dụng Tài Liệu

### Nếu bạn mới hoàn toàn với Rust:

1. Bắt đầu từ [Rust Basics](./02-rust-basics.md)
2. Đọc tuần tự từ 1 → 10
3. Làm theo [Roadmap](./09-roadmap.md)

### Nếu bạn đã biết Rust:

1. Đọc [Cấu trúc Dự án](./03-project-structure.md)
2. Tiếp theo [Kiến trúc](./04-architecture.md)
3. Xem [Examples](./08-examples.md)

### Tra cứu nhanh:

-   Tauri commands → [05-tauri-commands.md](./05-tauri-commands.md)
-   Database queries → [06-database-orm.md](./06-database-orm.md)
-   Error handling → [07-error-handling.md](./07-error-handling.md)

---

## 🔗 Liên kết Nhanh

| Loại             | Link                            |
| ---------------- | ------------------------------- |
| 📖 The Rust Book | https://doc.rust-lang.org/book/ |
| 🖥️ Tauri Docs    | https://tauri.app/v1/guides/    |
| 🐚 SeaORM Docs   | https://www.sea-ql.org/SeaORM/  |
| 💬 Rust Discord  | https://discord.gg/rust-lang    |

---

**Chúc bạn học tập vui vẻ! 🚀**
