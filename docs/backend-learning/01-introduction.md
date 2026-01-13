# 1. Giới thiệu Nhanh

> ⏱️ **Thời gian đọc**: 5 phút

---

## Vaultrs là gì?

Vaultrs là một ứng dụng desktop để quản lý **hàng triệu records** (phim, sách, ảnh, v.v) mà không cần server hay Docker.

### Đặc điểm nổi bật

| Tính năng            | Mô tả                                    |
| -------------------- | ---------------------------------------- |
| 🗄️ **Offline-first** | Chạy hoàn toàn local, không cần internet |
| ⚡ **Hiệu năng cao** | Virtual scrolling cho 10M+ records       |
| 📦 **Portable**      | Single file database (SQLite)            |
| 🔒 **Bảo mật**       | Dữ liệu chỉ nằm trên máy bạn             |

---

## Tại sao Rust?

| Điểm mạnh                     | Giải thích                                       |
| ----------------------------- | ------------------------------------------------ |
| ⚡ **Tốc độ**                 | Compile sang machine code, nhanh như C/C++       |
| 🔒 **An toàn bộ nhớ**         | Compiler kiểm tra memory safety tại compile-time |
| 🔄 **Async**                  | Tokio runtime cho non-blocking I/O               |
| 📦 **Cargo**                  | Package manager mạnh mẽ                          |
| 🎯 **Zero-cost abstractions** | High-level code với low-level performance        |

---

## Tech Stack Backend

```
┌─────────────────────────────────────────┐
│   Tauri v2 - Desktop Framework          │
│   (Kết nối Frontend & Rust)             │
├─────────────────────────────────────────┤
│   Tokio - Async Runtime                 │
│   (Xử lý concurrent tasks)              │
├─────────────────────────────────────────┤
│   SeaORM - Database ORM                 │
│   (Type-safe database queries)          │
├─────────────────────────────────────────┤
│   SQLite - Embedded Database            │
│   (Single file database)                │
└─────────────────────────────────────────┘
```

### Giải thích từng component

| Component    | Vai trò           | Tại sao chọn?                          |
| ------------ | ----------------- | -------------------------------------- |
| **Tauri v2** | Desktop framework | Nhẹ hơn Electron 10x, bảo mật hơn      |
| **Tokio**    | Async runtime     | Standard cho Rust async                |
| **SeaORM**   | ORM               | Type-safe, async-first, tốt với SQLite |
| **SQLite**   | Database          | Embedded, không cần setup              |

---

## So sánh với các lựa chọn khác

| Tiêu chí       | Rust + Tauri | Electron | Flutter    |
| -------------- | ------------ | -------- | ---------- |
| Bundle size    | ~3-5 MB      | ~150 MB  | ~20 MB     |
| Memory usage   | Thấp         | Cao      | Trung bình |
| Startup time   | Nhanh        | Chậm     | Trung bình |
| Learning curve | Cao          | Thấp     | Trung bình |

---

## Tiếp theo

➡️ [Rust Basics](./02-rust-basics.md) - Học cú pháp và concepts cơ bản của Rust
