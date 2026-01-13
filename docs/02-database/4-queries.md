# 🔎 Database Queries - Vaultrs

> **Mục tiêu:** Tài liệu các query patterns thường dùng trong Vaultrs với ví dụ cụ thể.

---

## 📋 TL;DR

| Query Type   | Use Case                     | Performance |
| ------------ | ---------------------------- | ----------- |
| Basic CRUD   | Create, Read, Update, Delete | < 10ms      |
| Pagination   | List with offset/limit       | < 50ms      |
| Search       | Title search                 | < 100ms     |
| Full-text    | FTS5 search                  | < 200ms     |
| JSON Extract | Filter by properties         | < 200ms     |

---

## 1. 📖 Basic CRUD Queries

### Create

```sql
-- Insert collection
INSERT INTO collections (name, slug, icon, description)
VALUES ('Movies', 'movies', '🎬', 'Film collection');

-- Insert attribute
INSERT INTO attributes (collection_id, name, key, type, display_order)
VALUES (1, 'Director', 'director', 'text', 1);

-- Insert item
INSERT INTO items (collection_id, title, properties)
VALUES (
    1,
    'Inception',
    json_object(
        'director', 'Christopher Nolan',
        'rating', 8.8,
        'release_year', 2010,
        'genre', json_array('Sci-Fi', 'Thriller')
    )
);
```

### Read

```sql
-- Get collection by slug
SELECT * FROM collections WHERE slug = 'movies';

-- Get item by ID
SELECT * FROM items WHERE id = 123;

-- Get items with specific fields
SELECT
    id,
    title,
    json_extract(properties, '$.rating') as rating
FROM items
WHERE collection_id = 1;
```

### Update

```sql
-- Update collection
UPDATE collections
SET name = 'Films', description = 'Updated description'
WHERE id = 1;

-- Update item properties (merge JSON)
UPDATE items
SET properties = json_patch(
    properties,
    '{"rating": 9.0, "status": "Completed"}'
)
WHERE id = 123;
```

### Delete

```sql
-- Delete item
DELETE FROM items WHERE id = 123;

-- Delete collection (cascades to attributes and items)
DELETE FROM collections WHERE id = 1;
```

---

## 2. 📄 Pagination Queries

### Offset-based

```sql
-- Page 1 (first 100 items)
SELECT id, title, properties
FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100 OFFSET 0;

-- Page 2
SELECT id, title, properties
FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100 OFFSET 100;
```

### Keyset Pagination (Better for large offsets)

```sql
-- First page
SELECT id, title, created_at
FROM items
WHERE collection_id = 1
ORDER BY created_at DESC, id DESC
LIMIT 100;

-- Next page (using last item's values)
SELECT id, title, created_at
FROM items
WHERE collection_id = 1
  AND (created_at, id) < (1704067200, 12345)
ORDER BY created_at DESC, id DESC
LIMIT 100;
```

### With Total Count

```sql
-- Get items and total count in one query
SELECT
    id, title, properties,
    (SELECT COUNT(*) FROM items WHERE collection_id = 1) as total_count
FROM items
WHERE collection_id = 1
ORDER BY created_at DESC
LIMIT 100;
```

---

## 3. 🔍 Search Queries

### Title Search (LIKE)

```sql
-- Case-insensitive search
SELECT id, title
FROM items
WHERE collection_id = 1
  AND title LIKE '%inception%' COLLATE NOCASE
ORDER BY title
LIMIT 50;
```

### Full-Text Search (FTS5)

```sql
-- Simple search
SELECT rowid, title, rank
FROM items_fts
WHERE items_fts MATCH 'inception'
ORDER BY rank
LIMIT 50;

-- Boolean search
SELECT rowid, title, rank
FROM items_fts
WHERE items_fts MATCH 'nolan AND (thriller OR action)'
ORDER BY rank
LIMIT 50;

-- Phrase search
SELECT rowid, title, rank
FROM items_fts
WHERE items_fts MATCH '"christopher nolan"'
ORDER BY rank
LIMIT 50;

-- Join with items table
SELECT i.*, fts.rank
FROM items_fts fts
JOIN items i ON i.id = fts.rowid
WHERE items_fts MATCH 'sci-fi'
  AND i.collection_id = 1
ORDER BY fts.rank
LIMIT 50;
```

---

## 4. 📦 JSON Queries

### Extract JSON Values

```sql
-- Single value
SELECT
    id,
    title,
    json_extract(properties, '$.director') as director
FROM items
WHERE collection_id = 1;

-- Multiple values
SELECT
    id,
    title,
    json_extract(properties, '$.director') as director,
    json_extract(properties, '$.rating') as rating,
    json_extract(properties, '$.release_year') as year
FROM items
WHERE collection_id = 1;
```

### Filter by JSON Value

```sql
-- Numeric comparison
SELECT id, title
FROM items
WHERE collection_id = 1
  AND json_extract(properties, '$.rating') > 8.0;

-- String comparison
SELECT id, title
FROM items
WHERE collection_id = 1
  AND json_extract(properties, '$.status') = 'Completed';

-- NULL check
SELECT id, title
FROM items
WHERE collection_id = 1
  AND json_extract(properties, '$.director') IS NOT NULL;
```

### Filter by JSON Array

```sql
-- Array contains value
SELECT id, title
FROM items, json_each(items.properties, '$.genre')
WHERE collection_id = 1
  AND json_each.value = 'Sci-Fi';

-- Count array items
SELECT
    id,
    title,
    json_array_length(properties, '$.genre') as genre_count
FROM items
WHERE collection_id = 1;
```

### Update JSON

```sql
-- Set single value
UPDATE items
SET properties = json_set(properties, '$.rating', 9.0)
WHERE id = 123;

-- Set multiple values
UPDATE items
SET properties = json_set(
    json_set(properties, '$.rating', 9.0),
    '$.status', 'Completed'
)
WHERE id = 123;

-- Remove key
UPDATE items
SET properties = json_remove(properties, '$.temp_field')
WHERE id = 123;

-- Merge JSON objects
UPDATE items
SET properties = json_patch(
    properties,
    '{"rating": 9.0, "notes": "Updated"}'
)
WHERE id = 123;
```

---

## 5. 📊 Aggregation Queries

### Count and Group

```sql
-- Items per collection
SELECT
    c.name,
    COUNT(i.id) as item_count
FROM collections c
LEFT JOIN items i ON i.collection_id = c.id
GROUP BY c.id
ORDER BY item_count DESC;

-- Items by year
SELECT
    json_extract(properties, '$.release_year') as year,
    COUNT(*) as count
FROM items
WHERE collection_id = 1
GROUP BY year
ORDER BY year DESC;

-- Average rating by genre
SELECT
    json_each.value as genre,
    AVG(json_extract(properties, '$.rating')) as avg_rating,
    COUNT(*) as count
FROM items, json_each(items.properties, '$.genre')
WHERE collection_id = 1
GROUP BY genre
ORDER BY avg_rating DESC;
```

### Statistics

```sql
-- Collection statistics
SELECT
    COUNT(*) as total_items,
    AVG(json_extract(properties, '$.rating')) as avg_rating,
    MAX(json_extract(properties, '$.rating')) as max_rating,
    MIN(json_extract(properties, '$.rating')) as min_rating
FROM items
WHERE collection_id = 1;

-- Recently added
SELECT id, title, created_at
FROM items
WHERE collection_id = 1
  AND created_at > strftime('%s', 'now', '-7 days')
ORDER BY created_at DESC;
```

---

## 6. 🦀 SeaORM Examples

### Basic Queries in Rust

```rust
use sea_orm::*;

// Find by ID
let item = Item::find_by_id(123)
    .one(&db)
    .await?;

// Find all in collection
let items = Item::find()
    .filter(item::Column::CollectionId.eq(1))
    .order_by_desc(item::Column::CreatedAt)
    .limit(100)
    .all(&db)
    .await?;

// Search by title
let items = Item::find()
    .filter(item::Column::CollectionId.eq(1))
    .filter(item::Column::Title.contains("inception"))
    .all(&db)
    .await?;
```

### Insert in Rust

```rust
let new_item = item::ActiveModel {
    collection_id: Set(1),
    title: Set("Inception".to_string()),
    properties: Set(serde_json::json!({
        "director": "Christopher Nolan",
        "rating": 8.8
    })),
    ..Default::default()
};

let result = new_item.insert(&db).await?;
```

### Update in Rust

```rust
let mut item: item::ActiveModel = Item::find_by_id(123)
    .one(&db)
    .await?
    .unwrap()
    .into();

item.title = Set("Updated Title".to_string());
item.update(&db).await?;
```

### Raw SQL in Rust

```rust
// For complex queries
let items: Vec<Item> = Item::find()
    .from_raw_sql(Statement::from_sql_and_values(
        DbBackend::Sqlite,
        r#"
        SELECT * FROM items
        WHERE collection_id = $1
          AND json_extract(properties, '$.rating') > $2
        ORDER BY created_at DESC
        LIMIT $3
        "#,
        [1.into(), 8.0.into(), 100.into()],
    ))
    .all(&db)
    .await?;
```

---

## 🔗 Tài liệu Liên quan

-   [Database Overview](./1-overview.md)
-   [Schema](./2-schema.md)
-   [Indexes](./3-indexes.md)

---

_Cập nhật: 2026-01-08_
