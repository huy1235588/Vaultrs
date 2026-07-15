# 💾 Tổng quan Database - Vaultrs

> **Mục tiêu:** Giới thiệu tổng quan về thiết kế database của Vaultrs, bao gồm lựa chọn công nghệ và các nguyên tắc thiết kế.

---

## 📋 TL;DR

| Thành phần   | Công nghệ/Cách tiếp cận | Lý do                              |
| ------------ | ------------------------ | ----------------------------------- |
| **Database** | SQLite 3.53.x             | Embedded, zero-config, portable    |
| **Mode**     | WAL (Write-Ahead Log)     | Better concurrency, crash recovery |
| **Schema**   | Hybrid EAV + JSON          | Flexibility + Performance          |
| **ORM**      | SeaORM 2.0                 | Async-first, type-safe             |
| **Target**   | 10M+ records                | Virtual scrolling + indexing       |

> 🆕 SQLite tối thiểu nên là **3.53.0+** — bản này sửa một lỗi hỏng dữ liệu liên quan đến WAL-reset đã tồn tại nhiều năm, ảnh hưởng trực tiếp tới chế độ WAL mà Vaultrs dùng làm trọng tâm hiệu năng. SeaORM đã lên bản **2.0 ổn định** (từ 0.12.x cũ) — xem chi tiết migration ở [Tech Stack](../01-architecture/3-tech-stack.md).

---

## 1. 📖 Tại sao SQLite?

### So sánh Database Options

```
┌──────────────────────────────────────────────────────────────┐
│              DATABASE COMPARISON                             │
├──────────────────────────────────────────────────────────────┤
│                 │  SQLite      │  PostgreSQL  │  MongoDB     │
│ Setup           │  Zero-config │  Server req. │  Server req. │
│ Portable        │  Single file │  No          │  No          │
│ Read Perf       │  Excellent   │  Excellent   │  Good        │
│ Concurrency     │  Limited     │  Excellent   │  Excellent   │
│ Use Case        │  Desktop     │  Server      │  Server      │
└──────────────────────────────────────────────────────────────┘
```

### SQLite Advantages cho Vaultrs

| Ưu điểm                | Giải thích                              |
| ---------------------- | ---------------------------------------- |
| **Zero Configuration** | Không cần install, setup server         |
| **Single File**        | Dễ backup (copy file), portable         |
| **Read Performance**   | Cực nhanh cho read-heavy workloads      |
| **ACID Transactions**  | Data integrity đầy đủ                   |
| **Mature & Stable**    | 26+ năm development, tested extensively |

### SQLite Limitations (và cách xử lý)

| Limitation          | Mitigation trong Vaultrs       |
| -------------------- | -------------------------------- |
| Single-writer        | WAL mode cho concurrent reads   |
| No network access    | OK - desktop app, single user   |
| Limited concurrency  | OK - single user, mainly reads  |

---

## 2. 🏛️ Schema Design Philosophy

### Hybrid EAV + JSON Approach

```
┌──────────────────────────────────────────────────────────────┐
│              SCHEMA DESIGN                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   FIXED COLUMNS (Indexed)          JSON COLUMN (Flexible)    │
│   ┌────────────────────────┐       ┌────────────────────┐    │
│   │ id (PK)                │       │ properties: {      │    │
│   │ collection_id (FK,IDX) │       │   "director": ..., │    │
│   │ title (IDX)            │       │   "rating": 8.5,   │    │
│   │ created_at (IDX)       │       │   "genre": [...],  │    │
│   │ updated_at             │       │   "custom": ...    │    │
│   └────────────────────────┘       │ }                  │    │
│                                    └────────────────────┘    │
│                                                              │
│   ✅ Fast queries                  ✅ Flexible schema       │
│   ✅ Sortable                      ✅ User-defined fields   │
│   ✅ Searchable                    ✅ No migrations needed  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tại sao không Pure Relational?

```sql
-- Pure relational sẽ cần table cho mỗi loại collection
CREATE TABLE movies (id, title, director, rating, ...);
CREATE TABLE books (id, title, author, isbn, ...);
CREATE TABLE games (id, title, developer, platform, ...);
-- ❌ Rigid schema, migration mỗi khi thêm field mới
```

### Tại sao không Pure JSON?

```sql
-- Pure JSON không có indexes
CREATE TABLE items (id, data JSON);
-- ❌ Không thể sort/filter hiệu quả trên JSON fields
-- ❌ Mọi query đều phải scan toàn bộ table
```

### Hybrid = Best of Both Worlds

```sql
-- Indexed columns cho common operations
CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    collection_id INTEGER,     -- ← Indexed
    title TEXT,                -- ← Indexed
    created_at INTEGER,        -- ← Indexed
    properties TEXT            -- ← JSON cho flexibility
);
```

---

## 3. 📊 Entity Relationship

### ER Diagram

```
┌──────────────────┐
│   collections    │
├──────────────────┤
│ id (PK)          │
│ name             │
│ slug (UNIQUE)    │
│ icon             │
│ created_at       │
│ updated_at       │
└──────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────┐         ┌──────────────────┐
│   attributes     │         │      items       │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ collection_id(FK)│◄────────│ collection_id(FK)│
│ name             │         │ title     (IDX)  │
│ key              │         │ created_at(IDX)  │
│ type             │         │ updated_at       │
│ options          │         │ properties(JSON) │
│ display_order    │         └──────────────────┘
│ required         │
└──────────────────┘
```

### Relationships

| Relationship            | Type | Description                            |
| ------------------------ | ---- | ---------------------------------------- |
| Collection → Items      | 1:N  | Một collection có nhiều items          |
| Collection → Attributes | 1:N  | Một collection có nhiều attributes     |
| Attribute → Item        | Meta | Attributes định nghĩa schema cho items |

---

## 4. ⚡ WAL Mode

### Write-Ahead Logging

```
┌──────────────────────────────────────────────────────────────┐
│                 WAL MODE vs JOURNAL MODE                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   JOURNAL MODE (Default)           WAL MODE                  │
│   ┌─────────────────────┐          ┌─────────────────────┐   │
│   │ Write locks entire  │          │ Readers never block │   │
│   │ database            │          │ by writers          │   │
│   │                     │          │                     │   │
│   │ Readers wait for    │          │ Writers append to   │   │
│   │ write to complete   │          │ WAL file            │   │
│   │                     │          │                     │   │
│   │ ❌ Poor concurrency│          │ ✅ Great concurrency│   │
│   └─────────────────────┘          └─────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Enable WAL Mode

```sql
PRAGMA journal_mode = WAL;
```

### Benefits cho Vaultrs

-   ✅ UI không bị block khi background crawler đang write
-   ✅ Better crash recovery
-   ✅ Faster writes (no full page writes)

---

## 5. 📁 Database Files

### File Structure

```
vaultrs/
├── data/
│   ├── vaultrs.db          # Main database file
│   ├── vaultrs.db-wal      # Write-ahead log
│   └── vaultrs.db-shm      # Shared memory file
└── backups/
    └── vaultrs_20260108.db # Backup files
```

### File Descriptions

| File             | Purpose                       | Size      |
| ----------------- | ------------------------------ | --------- |
| `vaultrs.db`     | Main database                 | Variable  |
| `vaultrs.db-wal` | Pending writes (WAL mode)     | Up to 1GB |
| `vaultrs.db-shm` | Shared memory for concurrency | 32KB      |

---

## 6. 🎯 Performance Targets

### Query Performance Goals

| Operation          | Target  | Notes             |
| -------------------- | ------- | ------------------ |
| Single item lookup | < 1ms   | By primary key    |
| Collection list    | < 50ms  | With pagination   |
| Title search       | < 100ms | Using LIKE or FTS |
| Full-text search   | < 200ms | Using FTS5        |
| Insert single      | < 10ms  | With indexes      |
| Bulk insert 1000   | < 500ms | In transaction    |

### Scale Targets

| Metric          | Target         |
| ---------------- | -------------- |
| Max items       | 10,000,000+    |
| Max collections | 10,000         |
| Max attributes  | 100/collection |
| Database size   | Up to 10GB     |

---

## 🔗 Tài liệu Liên quan

-   [Schema Chi tiết](./2-schema.md)
-   [Indexes & Performance](./3-indexes.md)
-   [Queries](./4-queries.md)
-   [Migrations](./5-migrations.md)
-   [Backup & Recovery](./6-backup.md)
-   [Field Data Handling](./7-field-data-handling.md)

---

_Cập nhật: 2026-07-16_
