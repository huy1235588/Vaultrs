# Database Schema Documentation

Complete documentation of Vaultrs's database structure, design decisions, and optimization strategies.

## Table of Contents

-   [Overview](#overview)
-   [Schema Design](#schema-design)
-   [Table Definitions](#table-definitions)
-   [Indexes and Performance](#indexes-and-performance)
-   [Query Examples](#query-examples)
-   [Migrations](#migrations)
-   [Optimization](#optimization)
-   [Backup and Recovery](#backup-and-recovery)

---

## Overview

Vaultrs uses **SQLite 3.x** with **WAL (Write-Ahead Logging)** mode for its embedded database. The schema follows a **hybrid EAV (Entity-Attribute-Value) + JSON** approach to balance flexibility and performance.

### Key Design Principles

1. **Embedded** - No separate database server required
2. **Portable** - Single file for easy backup
3. **Performant** - Optimized indexes for 10M+ rows
4. **Flexible** - Dynamic schema via JSON columns
5. **ACID** - Full transaction support

---

## Schema Design

### Entity Relationship Diagram

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
        ↓
┌──────────────────┐         ┌──────────────────┐
│   attributes     │         │      items       │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ collection_id(FK)│←────────│ collection_id(FK)│
│ name             │         │ title     (IDX)  │
│ key              │         │ created_at(IDX)  │
│ type             │         │ updated_at       │
│ options          │         │ properties(JSON) │
│ display_order    │         └──────────────────┘
│ required         │
└──────────────────┘
```

### Design Philosophy

**Why Hybrid EAV + JSON?**

| Approach        | Pros                             | Cons                     | Use Case         |
| --------------- | -------------------------------- | ------------------------ | ---------------- |
| Pure Relational | Type safety, fast queries        | Rigid schema             | Traditional apps |
| Pure JSON       | Maximum flexibility              | Slow queries, no indexes | Document stores  |
| **Hybrid**      | **Indexed fields + flexibility** | **Slightly complex**     | **Vaultrs**      |

---

## Table Definitions

### 1. Collections Table

Stores collection metadata (Movies, Books, TV Shows, etc.)

```sql
CREATE TABLE collections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    icon            TEXT,
    description     TEXT,
    created_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Index for lookup by slug
CREATE INDEX idx_collections_slug ON collections(slug);

-- Trigger to update updated_at
CREATE TRIGGER update_collections_updated_at
    AFTER UPDATE ON collections
BEGIN
    UPDATE collections SET updated_at = strftime('%s', 'now')
    WHERE id = NEW.id;
END;
```

**Example Data:**

```sql
INSERT INTO collections (name, slug, icon) VALUES
    ('Movies', 'movies', '🎬'),
    ('TV Shows', 'tv-shows', '📺'),
    ('Books', 'books', '📚'),
    ('Games', 'games', '🎮');
```

---

### 2. Attributes Table

Defines custom fields for each collection

```sql
CREATE TABLE attributes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id   INTEGER NOT NULL,
    name            TEXT NOT NULL,          -- Display name: "Release Year"
    key             TEXT NOT NULL,          -- JSON key: "release_year"
    type            TEXT NOT NULL,          -- Field type (see below)
    options         TEXT,                   -- JSON array for select types
    display_order   INTEGER DEFAULT 0,      -- Order in UI
    required        INTEGER DEFAULT 0,      -- Boolean: 1 = required
    searchable      INTEGER DEFAULT 0,      -- Boolean: 1 = searchable
    created_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(collection_id, key)              -- Prevent duplicate keys
);

-- Index for collection lookups
CREATE INDEX idx_attributes_collection ON attributes(collection_id);
```

**Field Types:**

-   `text` - Short text input
-   `textarea` - Long text input
-   `number` - Numeric input
-   `decimal` - Decimal number
-   `date` - Date picker
-   `datetime` - Date + time picker
-   `select` - Dropdown (single choice)
-   `multiselect` - Multi-choice dropdown
-   `checkbox` - Boolean checkbox
-   `url` - URL input with validation
-   `image` - Image URL/path
-   `file` - File path

**Example Data:**

```sql
INSERT INTO attributes (collection_id, name, key, type, display_order) VALUES
    (1, 'Director', 'director', 'text', 1),
    (1, 'Rating', 'rating', 'decimal', 2),
    (1, 'Release Year', 'release_year', 'number', 3),
    (1, 'Genre', 'genre', 'multiselect', 4),
    (1, 'Poster', 'poster', 'image', 5),
    (1, 'IMDB Link', 'imdb_url', 'url', 6);

-- Select type with options
INSERT INTO attributes (collection_id, name, key, type, options) VALUES
    (1, 'Status', 'status', 'select',
     '["To Watch", "Watching", "Completed", "Dropped"]');
```

---

### 3. Items Table

Main table storing actual data (10M+ rows)

```sql
CREATE TABLE items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id   INTEGER NOT NULL,
    title           TEXT NOT NULL,                      -- Extracted for indexing
    created_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    properties      TEXT NOT NULL DEFAULT '{}',         -- JSON blob

    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_items_collection ON items(collection_id);
CREATE INDEX idx_items_title ON items(title COLLATE NOCASE);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_updated_at ON items(updated_at DESC);

-- Composite index for common query pattern
CREATE INDEX idx_items_collection_created
    ON items(collection_id, created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_items_updated_at
    AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = strftime('%s', 'now')
    WHERE id = NEW.id;
END;
```

**Properties JSON Structure:**

```json
{
    "director": "Christopher Nolan",
    "rating": 8.8,
    "release_year": 2010,
    "genre": ["Sci-Fi", "Thriller", "Action"],
    "poster": "/posters/inception.jpg",
    "imdb_url": "https://www.imdb.com/title/tt1375666/",
    "status": "Completed",
    "notes": "Mind-bending masterpiece",
    "watched_date": "2024-01-15",
    "custom_field_1": "any value"
}
```

**Example Data:**

```sql
INSERT INTO items (collection_id, title, properties) VALUES (
    1,
    'Inception',
    json_object(
        'director', 'Christopher Nolan',
        'rating', 8.8,
        'release_year', 2010,
        'genre', json_array('Sci-Fi', 'Thriller'),
        'poster', '/posters/inception.jpg'
    )
);
```

---

### 4. Full-Text Search (Optional)

For advanced search capabilities:

```sql
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE items_fts USING fts5(
    title,
    properties,
    content='items',
    content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, title, properties)
    VALUES (NEW.id, NEW.title, NEW.properties);
END;

CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
    DELETE FROM items_fts WHERE rowid = OLD.id;
END;

CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
    UPDATE items_fts
    SET title = NEW.title, properties = NEW.properties
    WHERE rowid = NEW.id;
END;
```

---

## Indexes and Performance

### Index Strategy

| Index                          | Purpose              | Impact      |
| ------------------------------ | -------------------- | ----------- |
| `idx_items_collection`         | Filter by collection | 10x faster  |
| `idx_items_title`              | Search by title      | 50x faster  |
| `idx_items_created_at`         | Sort by date         | 20x faster  |
| `idx_items_collection_created` | Combined filter+sort | 100x faster |

### Index Size vs Performance

```sql
-- Check index sizes
SELECT
    name,
    (pgsize / 1024.0 / 1024.0) as size_mb
FROM dbstat
WHERE name LIKE 'idx_%'
ORDER BY pgsize DESC;
```

**Trade-offs:**

-   Each index adds ~10-20% to database size
-   Speeds up reads, slows down writes slightly
-   Worth it for read-heavy workloads (Vaultrs is 95% reads)

---

## Query Examples

### Basic Queries

```sql
-- Get all items in a collection
SELECT id, title, properties
FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100 OFFSET 0;

-- Search by title (case-insensitive)
SELECT id, title
FROM items
WHERE title LIKE '%inception%' COLLATE NOCASE
  AND collection_id = 1;

-- Extract JSON field
SELECT
    id,
    title,
    json_extract(properties, '$.rating') as rating
FROM items
WHERE collection_id = 1
  AND json_extract(properties, '$.rating') > 8.0;
```

### Advanced Queries

```sql
-- Filter by JSON array contains
SELECT id, title
FROM items, json_each(items.properties, '$.genre')
WHERE collection_id = 1
  AND json_each.value = 'Sci-Fi';

-- Aggregate by year
SELECT
    json_extract(properties, '$.release_year') as year,
    COUNT(*) as count,
    AVG(json_extract(properties, '$.rating')) as avg_rating
FROM items
WHERE collection_id = 1
GROUP BY year
ORDER BY year DESC;

-- Full-text search
SELECT id, title, rank
FROM items_fts
WHERE items_fts MATCH 'nolan AND thriller'
ORDER BY rank
LIMIT 50;
```

### Performance Queries

```sql
-- Explain query plan
EXPLAIN QUERY PLAN
SELECT * FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100;

-- Analyze table statistics
ANALYZE items;

-- Vacuum database
VACUUM;
```

---

## Migrations

### Migration Files

Migrations are located in `src-tauri/src/db/migrations/`

**Example Migration:**

```rust
// migrations/m20240101_000001_create_tables.rs
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20240101_000001_create_tables"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Collections::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Collections::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Collections::Name).text().not_null())
                    .col(ColumnDef::new(Collections::Slug).text().not_null().unique_key())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Collections::Table).to_owned())
            .await
    }
}
```

### Running Migrations

```bash
# Run all pending migrations
sea-orm-cli migrate up

# Rollback last migration
sea-orm-cli migrate down

# Generate new migration
sea-orm-cli migrate generate create_items_table
```

---

## Optimization

### SQLite Configuration

```sql
-- WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Faster syncs (safe for non-critical data)
PRAGMA synchronous = NORMAL;

-- Increase cache size (64MB)
PRAGMA cache_size = -64000;

-- Store temp tables in memory
PRAGMA temp_store = MEMORY;

-- Enable memory-mapped I/O (1GB)
PRAGMA mmap_size = 1073741824;

-- Auto-vacuum on close
PRAGMA auto_vacuum = INCREMENTAL;
```

### Query Optimization Tips

1. **Use LIMIT + OFFSET for pagination**

    ```sql
    SELECT * FROM items LIMIT 100 OFFSET 500;
    ```

2. **Filter before sorting**

    ```sql
    -- Good
    SELECT * FROM items WHERE collection_id = 1 ORDER BY created_at;

    -- Bad (sorts all rows first)
    SELECT * FROM items ORDER BY created_at WHERE collection_id = 1;
    ```

3. **Use covering indexes**

    ```sql
    -- Index includes all needed columns
    CREATE INDEX idx_items_cover
        ON items(collection_id, created_at, title);
    ```

4. **Batch inserts in transactions**
    ```rust
    let txn = db.begin().await?;
    for item in items {
        item.insert(&txn).await?;
    }
    txn.commit().await?;
    ```

---

## Backup and Recovery

### Automated Backups

```rust
// Backup on app close
pub async fn backup_database() -> Result<()> {
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_path = format!("backups/vaultrs_{}.db", timestamp);

    std::fs::copy("vaultrs.db", backup_path)?;
    Ok(())
}
```

### Manual Backup

```bash
# Copy database file
cp vaultrs.db vaultrs_backup_$(date +%Y%m%d).db

# Or use SQLite backup command
sqlite3 vaultrs.db ".backup 'vaultrs_backup.db'"
```

### Recovery

```bash
# Restore from backup
cp vaultrs_backup.db vaultrs.db

# Or if corrupted, try recovery
sqlite3 vaultrs.db ".recover" | sqlite3 recovered.db
```

### Export/Import

```sql
-- Export to SQL
.output backup.sql
.dump

-- Import from SQL
.read backup.sql

-- Export to CSV
.mode csv
.output items.csv
SELECT * FROM items;
```

---

## Database Maintenance

### Regular Maintenance Tasks

```sql
-- 1. Analyze statistics (weekly)
ANALYZE;

-- 2. Vacuum database (monthly)
VACUUM;

-- 3. Check integrity (monthly)
PRAGMA integrity_check;

-- 4. Optimize (after bulk operations)
PRAGMA optimize;
```

### Monitoring Queries

```sql
-- Database size
SELECT page_count * page_size / 1024.0 / 1024.0 as size_mb
FROM pragma_page_count(), pragma_page_size();

-- Table sizes
SELECT
    name,
    SUM(pgsize) / 1024.0 / 1024.0 as size_mb
FROM dbstat
WHERE name IN ('collections', 'attributes', 'items')
GROUP BY name;

-- Row counts
SELECT
    (SELECT COUNT(*) FROM collections) as collections,
    (SELECT COUNT(*) FROM attributes) as attributes,
    (SELECT COUNT(*) FROM items) as items;
```

---

## Related Documentation

-   [Architecture Overview](ARCHITECTURE.md) - System design
-   [API Reference](API.md) - Database commands
-   [Performance Guide](PERFORMANCE.md) - Optimization strategies

---

**Need help?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue!
