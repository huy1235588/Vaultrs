# 9. Roadmap Học Tập

> 📅 **Thời gian**: 4 tuần (2-3 giờ/ngày)

---

## Week 1: Rust Fundamentals

### Mục tiêu

-   [ ] Hiểu syntax cơ bản
-   [ ] Nắm vững Ownership & Borrowing
-   [ ] Thành thạo Pattern Matching

### Tasks

| Ngày | Nội dung                                     | Deliverable                  |
| ---- | -------------------------------------------- | ---------------------------- |
| 1-2  | Đọc [02-rust-basics.md](./02-rust-basics.md) | Chạy được ví dụ              |
| 3-4  | Practice Ownership                           | Viết 5 hàm không lỗi compile |
| 5-7  | Async/Await basics                           | Viết async function đầu tiên |

### Practice

```bash
cargo new rust_practice
cd rust_practice
# Edit src/main.rs
cargo run
```

---

## Week 2: Tauri & Project Structure

### Mục tiêu

-   [ ] Hiểu cấu trúc Vaultrs
-   [ ] Nắm được 3-layer architecture
-   [ ] Tạo được command đơn giản

### Tasks

| Ngày | Nội dung                                                 | Deliverable               |
| ---- | -------------------------------------------------------- | ------------------------- |
| 1-2  | Đọc [03-project-structure.md](./03-project-structure.md) | Map được file nào làm gì  |
| 3-4  | Đọc [04-architecture.md](./04-architecture.md)           | Giải thích được 3 layers  |
| 5-7  | Đọc [05-tauri-commands.md](./05-tauri-commands.md)       | Tạo command "hello world" |

### Kiểm tra

-   Trace được từ `invoke()` → `#[tauri::command]`?
-   Tìm được service của một entity?

---

## Week 3: Database & ORM

### Mục tiêu

-   [ ] Hiểu SeaORM entities
-   [ ] Thành thạo CRUD operations
-   [ ] Hiểu DTOs

### Tasks

| Ngày | Nội dung                                       | Deliverable                           |
| ---- | ---------------------------------------------- | ------------------------------------- |
| 1-2  | Đọc [06-database-orm.md](./06-database-orm.md) | Hiểu entity definition                |
| 3-5  | Practice CRUD                                  | Implement 4 operations cho entity mới |
| 6-7  | Relations                                      | Load data với related entities        |

---

## Week 4: Error Handling & Implementation

### Mục tiêu

-   [ ] Master error handling
-   [ ] Implement feature hoàn chỉnh
-   [ ] Debug và fix issues

### Tasks

| Ngày | Nội dung                                           | Deliverable                     |
| ---- | -------------------------------------------------- | ------------------------------- |
| 1-2  | Đọc [07-error-handling.md](./07-error-handling.md) | Thêm error type mới             |
| 3-5  | Implement feature                                  | 1 feature hoàn chỉnh end-to-end |
| 6-7  | Review & Refactor                                  | Code clean, có comments         |

---

## 🛠️ Commands Thường Dùng

```bash
cd desktop/src-tauri

cargo check     # Check syntax (nhanh)
cargo build     # Build
cargo run       # Run
cargo fmt       # Format code
cargo clippy    # Lint
cargo test      # Run tests
cargo doc --open # Docs
```

---

## Tiếp theo

➡️ [Tài liệu Tham khảo](./10-references.md)
