# 📋 Database Schema - Vaultrs

> **Mục tiêu:** Mô tả chi tiết schema của các tables trong database Vaultrs.

---

## 📋 TL;DR

| Table         | Purpose                  | Expected Rows |
| ------------- | ------------------------ | ------------- |
| `collections` | Collection definitions   | ~100          |
| `attributes`  | Custom field definitions | ~1,000        |
| `items`       | Main data storage        | 10,000,000+   |
| `items_fts`   | Full-text search index   | Virtual       |

---

## 1. 📂 Collections Table

Lưu trữ metadata của các collections (Movies, Books, Games, etc.)

### DDL

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

-- Index
CREATE INDEX idx_collections_slug ON collections(slug);

-- Auto-update trigger
CREATE TRIGGER update_collections_updated_at
    AFTER UPDATE ON collections
BEGIN
    UPDATE collections SET updated_at = strftime('%s', 'now')
    WHERE id = NEW.id;
END;
```

### Columns

| Column        | Type    | Constraints      | Description             |
| ------------- | ------- | ---------------- | ----------------------- |
| `id`          | INTEGER | PK, AUTO         | Unique identifier       |
| `name`        | TEXT    | NOT NULL         | Display name            |
| `slug`        | TEXT    | UNIQUE, NOT NULL | URL-friendly identifier |
| `icon`        | TEXT    | -                | Emoji hoặc icon path    |
| `description` | TEXT    | -                | Collection description  |
| `created_at`  | INTEGER | NOT NULL         | Unix timestamp          |
| `updated_at`  | INTEGER | NOT NULL         | Unix timestamp          |

### Example Data

```sql
INSERT INTO collections (name, slug, icon, description) VALUES
    ('Movies', 'movies', '🎬', 'Film collection'),
    ('TV Shows', 'tv-shows', '📺', 'Television series'),
    ('Books', 'books', '📚', 'Book library'),
    ('Games', 'games', '🎮', 'Video game collection');
```

---

## 2. 🏷️ Attributes Table

Định nghĩa custom fields cho mỗi collection.

### DDL

```sql
CREATE TABLE attributes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id   INTEGER NOT NULL,
    name            TEXT NOT NULL,
    key             TEXT NOT NULL,
    type            TEXT NOT NULL,
    options         TEXT,
    display_order   INTEGER DEFAULT 0,
    required        INTEGER DEFAULT 0,
    searchable      INTEGER DEFAULT 0,
    created_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(collection_id, key)
);

-- Index
CREATE INDEX idx_attributes_collection ON attributes(collection_id);
```

### Columns

| Column          | Type    | Constraints  | Description             |
| --------------- | ------- | ------------ | ----------------------- |
| `id`            | INTEGER | PK, AUTO     | Unique identifier       |
| `collection_id` | INTEGER | FK, NOT NULL | Parent collection       |
| `name`          | TEXT    | NOT NULL     | Display name            |
| `key`           | TEXT    | NOT NULL     | JSON object key         |
| `type`          | TEXT    | NOT NULL     | Field type              |
| `options`       | TEXT    | -            | JSON for select options |
| `display_order` | INTEGER | DEFAULT 0    | Order in UI             |
| `required`      | INTEGER | DEFAULT 0    | Boolean (0/1)           |
| `searchable`    | INTEGER | DEFAULT 0    | Include in FTS          |
| `created_at`    | INTEGER | NOT NULL     | Unix timestamp          |

### Field Types

| Type          | Input Component | Validation         |
| ------------- | --------------- | ------------------ |
| `text`        | Text input      | Max 255 chars      |
| `textarea`    | Text area       | Max 10000 chars    |
| `number`      | Number input    | Integer            |
| `decimal`     | Number input    | Float              |
| `date`        | Date picker     | ISO date           |
| `datetime`    | Datetime picker | ISO datetime       |
| `select`      | Dropdown        | From options       |
| `multiselect` | Multi-select    | Array from options |
| `checkbox`    | Checkbox        | Boolean            |
| `url`         | URL input       | Valid URL          |
| `image`       | Image picker    | Valid path/URL     |
| `file`        | File picker     | Valid path         |

### Example Data

```sql
-- Movies collection attributes
INSERT INTO attributes (collection_id, name, key, type, display_order, required) VALUES
    (1, 'Director', 'director', 'text', 1, 0),
    (1, 'Rating', 'rating', 'decimal', 2, 0),
    (1, 'Release Year', 'release_year', 'number', 3, 0),
    (1, 'Poster', 'poster', 'image', 4, 0);

-- Select with options
INSERT INTO attributes (collection_id, name, key, type, options, display_order) VALUES
    (1, 'Status', 'status', 'select',
     '["To Watch", "Watching", "Completed", "Dropped"]', 5);

-- Multi-select
INSERT INTO attributes (collection_id, name, key, type, options, display_order) VALUES
    (1, 'Genre', 'genre', 'multiselect',
     '["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance"]', 6);
```

---

## 3. 📝 Items Table

Table chính lưu trữ data (10M+ rows).

### DDL

```sql
CREATE TABLE items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id   INTEGER NOT NULL,
    title           TEXT NOT NULL,
    created_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    properties      TEXT NOT NULL DEFAULT '{}',

    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_items_collection ON items(collection_id);
CREATE INDEX idx_items_title ON items(title COLLATE NOCASE);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_updated_at ON items(updated_at DESC);
CREATE INDEX idx_items_collection_created ON items(collection_id, created_at DESC);

-- Auto-update trigger
CREATE TRIGGER update_items_updated_at
    AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = strftime('%s', 'now')
    WHERE id = NEW.id;
END;
```

### Columns

| Column          | Type    | Constraints  | Description          |
| --------------- | ------- | ------------ | -------------------- |
| `id`            | INTEGER | PK, AUTO     | Unique identifier    |
| `collection_id` | INTEGER | FK, NOT NULL | Parent collection    |
| `title`         | TEXT    | NOT NULL     | Item title (indexed) |
| `created_at`    | INTEGER | NOT NULL     | Unix timestamp       |
| `updated_at`    | INTEGER | NOT NULL     | Unix timestamp       |
| `properties`    | TEXT    | NOT NULL     | JSON blob            |

### Properties JSON Structure

```json
{
    "director": "Christopher Nolan",
    "rating": 8.8,
    "release_year": 2010,
    "genre": ["Sci-Fi", "Thriller", "Action"],
    "poster": "/posters/inception.jpg",
    "imdb_url": "https://www.imdb.com/title/tt1375666/",
    "status": "Completed",
    "notes": "Mind-bending masterpiece"
}
```

### Example Data

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

## 4. 🔍 Full-Text Search (FTS5)

Virtual table cho full-text search.

### DDL

```sql
CREATE VIRTUAL TABLE items_fts USING fts5(
    title,
    properties,
    content='items',
    content_rowid='id'
);

-- Sync triggers
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

### Usage

```sql
-- Search
SELECT id, title, rank
FROM items_fts
WHERE items_fts MATCH 'nolan AND thriller'
ORDER BY rank
LIMIT 50;
```

---

## 5. 📐 Schema Diagram (Complete)

```
┌──────────────────────────────────────────────────────────────────┐
│                         VAULTRS SCHEMA                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                             │
│  │  collections    │                                             │
│  ├─────────────────┤                                             │
│  │ id         (PK) │                                             │
│  │ name            │                                             │
│  │ slug       (UQ) │                                             │
│  │ icon            │                                             │
│  │ description     │                                             │
│  │ created_at      │                                             │
│  │ updated_at      │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│     ┌─────┴─────┐                                                │
│     │           │                                                │
│     ▼           ▼                                                │
│  ┌─────────────────┐      ┌─────────────────┐                    │
│  │  attributes     │      │     items       │                    │
│  ├─────────────────┤      ├─────────────────┤                    │
│  │ id         (PK) │      │ id         (PK) │                    │
│  │ collection_id   │      │ collection_id   │                    │
│  │ name            │      │ title      (IX) │                    │
│  │ key        (UQ) │      │ created_at (IX) │                    │
│  │ type            │      │ updated_at      │                    │
│  │ options    (JS) │      │ properties (JS) │                    │
│  │ display_order   │      └────────┬────────┘                    │
│  │ required        │               │                             │
│  │ searchable      │               │ Virtual                     │
│  └─────────────────┘               ▼                             │
│                           ┌─────────────────┐                    │
│                           │   items_fts     │                    │
│                           ├─────────────────┤                    │
│                           │ title           │                    │
│                           │ properties      │                    │
│                           │ (FTS5 Virtual)  │                    │
│                           └─────────────────┘                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Legend: PK = Primary Key, FK = Foreign Key, UQ = Unique,
        IX = Indexed, JS = JSON
```

---

## 🔗 Tài liệu Liên quan

-   [Database Overview](./1-overview.md)
-   [Indexes & Performance](./3-indexes.md)
-   [Queries](./4-queries.md)

---

_Cập nhật: 2026-01-08_
