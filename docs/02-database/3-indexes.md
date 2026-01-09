# ⚡ Indexes & Performance - Vaultrs

> **Mục tiêu:** Giải thích chiến lược indexing và tối ưu performance cho database Vaultrs.

---

## 📋 TL;DR

| Index                          | Column(s)                    | Purpose              |
| ------------------------------ | ---------------------------- | -------------------- |
| `idx_items_collection`         | `collection_id`              | Filter by collection |
| `idx_items_title`              | `title`                      | Search by title      |
| `idx_items_created_at`         | `created_at DESC`            | Sort by date         |
| `idx_items_collection_created` | `collection_id, created_at`  | Combined filter+sort |

---

## 1. 📊 Index Strategy

### Current Indexes

```sql
-- Primary lookups
CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_attributes_collection ON attributes(collection_id);

-- Items table (main performance focus)
CREATE INDEX idx_items_collection ON items(collection_id);
CREATE INDEX idx_items_title ON items(title COLLATE NOCASE);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_updated_at ON items(updated_at DESC);

-- Composite index for common query pattern
CREATE INDEX idx_items_collection_created 
    ON items(collection_id, created_at DESC);
```

### Index Selection Rationale

```
┌──────────────────────────────────────────────────────────────┐
│                 QUERY PATTERN ANALYSIS                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Most Common Query (90% of requests):                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ SELECT * FROM items                                      ││
│  │ WHERE collection_id = ?                                  ││
│  │ ORDER BY created_at DESC                                 ││
│  │ LIMIT 100 OFFSET ?                                       ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  → idx_items_collection_created covers this perfectly        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 🔍 Index Types

### B-Tree Index (Default)

```sql
-- Standard B-tree index
CREATE INDEX idx_items_collection ON items(collection_id);

-- Good for:
-- ✅ Equality: WHERE collection_id = 1
-- ✅ Range: WHERE created_at > 1704067200
-- ✅ Sorting: ORDER BY created_at
```

### Collation Index

```sql
-- Case-insensitive text index
CREATE INDEX idx_items_title ON items(title COLLATE NOCASE);

-- Good for:
-- ✅ Case-insensitive search: WHERE title LIKE '%inception%'
```

### Composite Index

```sql
-- Multi-column index
CREATE INDEX idx_items_collection_created 
    ON items(collection_id, created_at DESC);

-- Covers queries that:
-- ✅ Filter by collection_id AND
-- ✅ Sort by created_at
-- → No additional lookup needed (covering index)
```

---

## 3. 📈 Performance Impact

### Benchmark Results (Simulated 1M rows)

| Query Type            | Without Index | With Index | Speedup |
| --------------------- | ------------- | ---------- | ------- |
| Filter by collection  | 500ms         | 5ms        | 100x    |
| Search by title       | 800ms         | 15ms       | 53x     |
| Sort by created_at    | 1200ms        | 50ms       | 24x     |
| Filter + Sort         | 1500ms        | 8ms        | 187x    |

### Index Size vs Performance Trade-off

```
┌──────────────────────────────────────────────────────────────┐
│                 INDEX SIZE TRADE-OFF                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Database Size: 1 GB (data only)                            │
│                                                              │
│   Indexes:                                                   │
│   ├── idx_items_collection:         ~50 MB  (+5%)            │
│   ├── idx_items_title:              ~100 MB (+10%)           │
│   ├── idx_items_created_at:         ~50 MB  (+5%)            │
│   └── idx_items_collection_created: ~80 MB  (+8%)            │
│                                                              │
│   Total with indexes: ~1.28 GB (+28%)                        │
│                                                              │
│   Trade-off: 28% more storage for 100x faster reads          │
│   → Worth it for read-heavy workload (95% reads)             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 🔎 Query Optimization

### EXPLAIN QUERY PLAN

```sql
-- Always check query plan for slow queries
EXPLAIN QUERY PLAN
SELECT * FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100;

-- Good result (uses index):
-- SEARCH items USING INDEX idx_items_collection_created

-- Bad result (full scan):
-- SCAN items
```

### Common Query Patterns

**Pattern 1: List items in collection**
```sql
-- ✅ Optimized (uses composite index)
SELECT id, title, properties
FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100 OFFSET 0;
```

**Pattern 2: Search by title**
```sql
-- ✅ Uses title index
SELECT id, title
FROM items
WHERE collection_id = 1
  AND title LIKE '%inception%' COLLATE NOCASE;
```

**Pattern 3: Filter by JSON property**
```sql
-- ⚠️ No index on JSON - use sparingly
SELECT id, title
FROM items
WHERE collection_id = 1
  AND json_extract(properties, '$.rating') > 8.0;
```

**Pattern 4: Full-text search**
```sql
-- ✅ Uses FTS5 index
SELECT i.id, i.title, fts.rank
FROM items_fts fts
JOIN items i ON i.id = fts.rowid
WHERE items_fts MATCH 'thriller AND action'
ORDER BY fts.rank;
```

---

## 5. ⚙️ SQLite Configuration

### Performance PRAGMAs

```sql
-- WAL mode (required)
PRAGMA journal_mode = WAL;

-- Sync mode (safe but faster)
PRAGMA synchronous = NORMAL;

-- Cache size (64MB)
PRAGMA cache_size = -64000;

-- Temp tables in memory
PRAGMA temp_store = MEMORY;

-- Memory-mapped I/O (1GB)
PRAGMA mmap_size = 1073741824;

-- Page size (4KB default, good for most cases)
PRAGMA page_size = 4096;
```

### Rust Implementation

```rust
// src-tauri/src/db/connection.rs
pub async fn configure_db(db: &DatabaseConnection) -> Result<()> {
    db.execute_unprepared("PRAGMA journal_mode = WAL;").await?;
    db.execute_unprepared("PRAGMA synchronous = NORMAL;").await?;
    db.execute_unprepared("PRAGMA cache_size = -64000;").await?;
    db.execute_unprepared("PRAGMA temp_store = MEMORY;").await?;
    db.execute_unprepared("PRAGMA mmap_size = 1073741824;").await?;
    Ok(())
}
```

---

## 6. 📊 Monitoring

### Check Index Usage

```sql
-- List all indexes
SELECT name, sql FROM sqlite_master 
WHERE type = 'index' AND name NOT LIKE 'sqlite_%';

-- Index sizes
SELECT
    name,
    SUM(pgsize) / 1024.0 / 1024.0 as size_mb
FROM dbstat
WHERE name LIKE 'idx_%'
GROUP BY name
ORDER BY size_mb DESC;
```

### Database Statistics

```sql
-- Total database size
SELECT page_count * page_size / 1024.0 / 1024.0 as size_mb
FROM pragma_page_count(), pragma_page_size();

-- Table row counts
SELECT
    (SELECT COUNT(*) FROM collections) as collections,
    (SELECT COUNT(*) FROM attributes) as attributes,
    (SELECT COUNT(*) FROM items) as items;

-- Update statistics for query planner
ANALYZE;
```

---

## 7. 🚫 Anti-Patterns

### ❌ Don't Do This

```sql
-- 1. SELECT * when you don't need all columns
SELECT * FROM items WHERE collection_id = 1;
-- ✅ Better: SELECT id, title FROM items WHERE collection_id = 1;

-- 2. OFFSET with large values (slow!)
SELECT * FROM items LIMIT 100 OFFSET 999900;
-- ✅ Better: Use keyset pagination (WHERE id > last_id)

-- 3. Multiple OR conditions (can't use index well)
SELECT * FROM items WHERE title LIKE '%a%' OR title LIKE '%b%';
-- ✅ Better: Use UNION or FTS

-- 4. Functions on indexed columns
SELECT * FROM items WHERE LOWER(title) = 'inception';
-- ✅ Better: Use COLLATE NOCASE index
```

---

## 8. 🔄 Maintenance

### Regular Maintenance Tasks

```sql
-- Weekly: Update statistics
ANALYZE;

-- Monthly: Reclaim space
VACUUM;

-- Monthly: Check integrity
PRAGMA integrity_check;

-- After bulk operations
PRAGMA optimize;
```

### Rust Maintenance Function

```rust
pub async fn run_maintenance(db: &DatabaseConnection) -> Result<()> {
    db.execute_unprepared("ANALYZE;").await?;
    db.execute_unprepared("PRAGMA optimize;").await?;
    Ok(())
}
```

---

## 🔗 Tài liệu Liên quan

- [Database Overview](./1-overview.md)
- [Schema](./2-schema.md)
- [Queries](./4-queries.md)

---

_Cập nhật: 2026-01-08_
