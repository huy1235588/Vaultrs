# 🔄 Database Migrations - Vaultrs

> **Mục tiêu:** Hướng dẫn quản lý schema migrations với SeaORM.

---

## 📋 TL;DR

| Command                        | Purpose                   |
| ------------------------------ | ------------------------- |
| `sea-orm-cli migrate generate` | Tạo migration mới         |
| `sea-orm-cli migrate up`       | Chạy pending migrations   |
| `sea-orm-cli migrate down`     | Rollback migration cuối   |
| `sea-orm-cli migrate status`   | Xem trạng thái migrations |

---

## 1. 📁 Migration Structure

### Directory Layout

```
desktop/src-tauri/
├── Cargo.toml
└── src/
    └── db/
        └── migrations/
            ├── mod.rs
            ├── m20260101_000001_create_collections.rs
            ├── m20260101_000002_create_attributes.rs
            └── m20260101_000003_create_items.rs
```

### Migration Naming Convention

```
m{YYYYMMDD}_{NNNNNN}_{description}.rs

Examples:
- m20260101_000001_create_collections.rs
- m20260101_000002_create_attributes.rs
- m20260115_000001_add_searchable_column.rs
```

---

## 2. 📝 Creating Migrations

### Generate New Migration

```bash
cd desktop/src-tauri
sea-orm-cli migrate generate create_collections
```

### Migration Template

```rust
// migrations/m20260101_000001_create_collections.rs

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Migration logic here
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
                    .col(
                        ColumnDef::new(Collections::Slug)
                            .text()
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Collections::Icon).text())
                    .col(ColumnDef::new(Collections::Description).text())
                    .col(
                        ColumnDef::new(Collections::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("strftime('%s', 'now')")),
                    )
                    .col(
                        ColumnDef::new(Collections::UpdatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("strftime('%s', 'now')")),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Rollback logic
        manager
            .drop_table(Table::drop().table(Collections::Table).to_owned())
            .await
    }
}

// Define table and column identifiers
#[derive(Iden)]
enum Collections {
    Table,
    Id,
    Name,
    Slug,
    Icon,
    Description,
    CreatedAt,
    UpdatedAt,
}
```

---

## 3. 🔧 Common Migration Operations

### Create Table

```rust
manager
    .create_table(
        Table::create()
            .table(Items::Table)
            .if_not_exists()
            .col(ColumnDef::new(Items::Id).integer().primary_key().auto_increment())
            .col(ColumnDef::new(Items::CollectionId).integer().not_null())
            .col(ColumnDef::new(Items::Title).text().not_null())
            .col(ColumnDef::new(Items::Properties).text().not_null().default("{}"))
            .foreign_key(
                ForeignKey::create()
                    .from(Items::Table, Items::CollectionId)
                    .to(Collections::Table, Collections::Id)
                    .on_delete(ForeignKeyAction::Cascade),
            )
            .to_owned(),
    )
    .await
```

### Create Index

```rust
manager
    .create_index(
        Index::create()
            .name("idx_items_collection")
            .table(Items::Table)
            .col(Items::CollectionId)
            .to_owned(),
    )
    .await
```

### Add Column

```rust
manager
    .alter_table(
        Table::alter()
            .table(Items::Table)
            .add_column(
                ColumnDef::new(Items::Searchable)
                    .integer()
                    .not_null()
                    .default(0),
            )
            .to_owned(),
    )
    .await
```

### Drop Column

```rust
manager
    .alter_table(
        Table::alter()
            .table(Items::Table)
            .drop_column(Items::OldColumn)
            .to_owned(),
    )
    .await
```

### Raw SQL (for complex operations)

```rust
manager
    .get_connection()
    .execute_unprepared(
        r#"
        CREATE TRIGGER update_items_updated_at
            AFTER UPDATE ON items
        BEGIN
            UPDATE items SET updated_at = strftime('%s', 'now')
            WHERE id = NEW.id;
        END;
        "#,
    )
    .await?;
```

---

## 4. ⚡ Running Migrations

### Commands

```bash
# Run all pending migrations
sea-orm-cli migrate up

# Rollback last migration
sea-orm-cli migrate down

# Rollback N migrations
sea-orm-cli migrate down -n 3

# Check migration status
sea-orm-cli migrate status

# Fresh start (drop all, re-run)
sea-orm-cli migrate fresh

# Reset (rollback all)
sea-orm-cli migrate reset
```

### Programmatic Migration (App Startup)

```rust
// src-tauri/src/db/mod.rs
use sea_orm_migration::MigratorTrait;

pub async fn init_database() -> Result<DatabaseConnection, DbErr> {
    let db_path = get_db_path();
    let db_url = format!("sqlite:{}?mode=rwc", db_path);

    let db = Database::connect(&db_url).await?;

    // Run migrations on startup
    Migrator::up(&db, None).await?;

    // Configure SQLite
    configure_sqlite(&db).await?;

    Ok(db)
}
```

---

## 5. 📋 Migration Registry

### Register Migrations

```rust
// migrations/mod.rs
pub use sea_orm_migration::prelude::*;

mod m20260101_000001_create_collections;
mod m20260101_000002_create_attributes;
mod m20260101_000003_create_items;
mod m20260101_000004_create_fts;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260101_000001_create_collections::Migration),
            Box::new(m20260101_000002_create_attributes::Migration),
            Box::new(m20260101_000003_create_items::Migration),
            Box::new(m20260101_000004_create_fts::Migration),
        ]
    }
}
```

---

## 6. ✅ Best Practices

### Do's

-   ✅ One logical change per migration
-   ✅ Always provide `down()` method
-   ✅ Test migrations on copy of production data
-   ✅ Use transactions for multi-step operations
-   ✅ Backup before running migrations
-   ✅ Version control migrations

### Don'ts

-   ❌ Modify existing migrations
-   ❌ Delete migrations that have been run
-   ❌ Commit migrations that don't pass tests
-   ❌ Skip migration numbers
-   ❌ Include data changes in schema migrations

---

## 🔗 Tài liệu Liên quan

-   [Database Overview](./1-overview.md)
-   [Schema](./2-schema.md)
-   [SeaORM Docs](https://www.sea-ql.org/SeaORM/)

---

_Cập nhật: 2026-01-08_
