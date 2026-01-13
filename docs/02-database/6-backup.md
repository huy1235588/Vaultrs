# 💾 Backup & Recovery - Vaultrs

> **Mục tiêu:** Hướng dẫn backup và recovery database Vaultrs.

---

## 📋 TL;DR

| Task              | Command/Method                |
| ----------------- | ----------------------------- |
| **Manual backup** | Copy `vaultrs.db` file        |
| **SQLite backup** | `.backup` command             |
| **Export SQL**    | `.dump` command               |
| **Restore**       | Copy backup file hoặc `.read` |
| **Verify**        | `PRAGMA integrity_check`      |

---

## 1. 📦 Backup Methods

### Method 1: File Copy (Simple)

```bash
# Windows
copy vaultrs.db vaultrs_backup_%date:~-4%%date:~3,2%%date:~0,2%.db

# Linux/macOS
cp vaultrs.db vaultrs_backup_$(date +%Y%m%d).db
```

> ⚠️ **Important:** Đảm bảo app không đang write khi copy

### Method 2: SQLite Backup Command (Safe)

```bash
sqlite3 vaultrs.db ".backup 'backup.db'"
```

This method is **hot-backup safe** - có thể chạy khi app đang running.

### Method 3: Export to SQL

```bash
sqlite3 vaultrs.db ".output backup.sql" ".dump"
```

Tạo file SQL có thể đọc được và import lại.

---

## 2. 🔧 Automated Backup (Rust)

### On App Close

```rust
// src-tauri/src/backup.rs
use std::fs;
use chrono::Utc;

pub fn backup_database(source: &str, backup_dir: &str) -> Result<String, std::io::Error> {
    // Create backup directory if needed
    fs::create_dir_all(backup_dir)?;

    // Generate backup filename with timestamp
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let backup_path = format!("{}/vaultrs_{}.db", backup_dir, timestamp);

    // Copy database file
    fs::copy(source, &backup_path)?;

    // Clean old backups (keep last 5)
    cleanup_old_backups(backup_dir, 5)?;

    Ok(backup_path)
}

fn cleanup_old_backups(dir: &str, keep: usize) -> Result<(), std::io::Error> {
    let mut backups: Vec<_> = fs::read_dir(dir)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "db"))
        .collect();

    // Sort by modified time (newest first)
    backups.sort_by_key(|e| std::cmp::Reverse(e.metadata().ok()?.modified().ok()?));

    // Delete old backups
    for backup in backups.into_iter().skip(keep) {
        fs::remove_file(backup.path())?;
    }

    Ok(())
}
```

### Tauri Command

```rust
#[tauri::command]
async fn create_backup() -> Result<String, String> {
    let db_path = get_database_path();
    let backup_dir = get_backup_directory();

    backup_database(&db_path, &backup_dir)
        .map_err(|e| e.to_string())
}
```

---

## 3. 🔄 Recovery Methods

### Method 1: Restore from File Backup

```bash
# Stop the app first!
cp vaultrs_backup.db vaultrs.db
```

### Method 2: Restore from SQL Dump

```bash
sqlite3 vaultrs_new.db < backup.sql
```

### Method 3: Recovery from Corrupted Database

```bash
# Try to recover what's possible
sqlite3 vaultrs.db ".recover" | sqlite3 recovered.db
```

---

## 4. ✅ Verification

### Integrity Check

```sql
-- Check database integrity
PRAGMA integrity_check;

-- Expected output: "ok"
-- Any other output indicates corruption
```

### Quick Verify

```sql
-- Check table counts
SELECT 'collections' as table_name, COUNT(*) as count FROM collections
UNION ALL
SELECT 'attributes', COUNT(*) FROM attributes
UNION ALL
SELECT 'items', COUNT(*) FROM items;
```

### Rust Implementation

```rust
pub async fn verify_database(db: &DatabaseConnection) -> Result<bool, DbErr> {
    let result = db
        .query_one(Statement::from_string(
            DbBackend::Sqlite,
            "PRAGMA integrity_check;".to_string(),
        ))
        .await?;

    if let Some(row) = result {
        let check: String = row.try_get("", "integrity_check")?;
        return Ok(check == "ok");
    }

    Ok(false)
}
```

---

## 5. 📅 Backup Schedule

### Recommended Strategy

| Backup Type   | Frequency   | Retention |
| ------------- | ----------- | --------- |
| Auto on close | Every close | Last 5    |
| Manual export | Weekly      | Last 4    |
| Full SQL dump | Monthly     | Last 12   |

### Backup Locations

```
vaultrs/
├── data/
│   └── vaultrs.db           # Active database
└── backups/
    ├── auto/                 # Auto backups on close
    │   ├── vaultrs_20260101_120000.db
    │   └── vaultrs_20260102_180000.db
    └── manual/               # Manual backups
        └── vaultrs_20260101.db
```

---

## 6. ☁️ Export Options

### Export to JSON

```rust
use serde_json::json;

pub async fn export_collection_to_json(
    db: &DatabaseConnection,
    collection_id: i32,
) -> Result<String, DbErr> {
    let items = Item::find()
        .filter(item::Column::CollectionId.eq(collection_id))
        .all(db)
        .await?;

    let json = json!({
        "exported_at": chrono::Utc::now().to_rfc3339(),
        "collection_id": collection_id,
        "items": items,
    });

    Ok(serde_json::to_string_pretty(&json).unwrap())
}
```

### Export to CSV

```sql
.mode csv
.headers on
.output items.csv
SELECT id, title, json_extract(properties, '$.rating') as rating
FROM items WHERE collection_id = 1;
.output stdout
```

---

## 7. 🚨 Disaster Recovery

### Common Issues

| Issue              | Solution                    |
| ------------------ | --------------------------- |
| Database corrupted | `.recover` command          |
| App won't start    | Delete WAL files, try again |
| Missing data       | Restore from backup         |
| Slow after crash   | `VACUUM` and `ANALYZE`      |

### Emergency WAL Recovery

```bash
# If app crashed during write, WAL may have uncommitted data
# This checkpoints WAL back to main DB
sqlite3 vaultrs.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

### Complete Reset

```bash
# Nuclear option - fresh start
rm vaultrs.db vaultrs.db-wal vaultrs.db-shm
# App will create new database on next start
```

---

## 🔗 Tài liệu Liên quan

-   [Database Overview](./1-overview.md)
-   [Schema](./2-schema.md)
-   [Indexes](./3-indexes.md)

---

_Cập nhật: 2026-01-08_
