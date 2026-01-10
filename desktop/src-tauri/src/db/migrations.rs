//! Database migrations for schema setup.

use sea_orm::DatabaseConnection;

use crate::core::AppResult;

/// SQL migrations to run in order.
const MIGRATIONS: &[(&str, &str)] = &[
    (
        "001_create_vaults",
        r#"
        CREATE TABLE IF NOT EXISTS vaults (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            icon        TEXT,
            color       TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    ),
    (
        "002_create_entries",
        r#"
        CREATE TABLE IF NOT EXISTS entries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            vault_id    INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            description TEXT,
            metadata    TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_entries_vault_id ON entries(vault_id);
        CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
        "#,
    ),
    (
        "003_create_migrations_table",
        r#"
        CREATE TABLE IF NOT EXISTS _migrations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL UNIQUE,
            applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    ),
    (
        "004_create_field_definitions",
        r#"
        CREATE TABLE IF NOT EXISTS field_definitions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            vault_id    INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            field_type  TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'url', 'boolean', 'select')),
            options     TEXT,
            position    INTEGER NOT NULL DEFAULT 0,
            required    INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(vault_id, name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_field_definitions_vault ON field_definitions(vault_id);
        "#,
    ),
    (
        "005_create_entries_fts",
        r#"
        -- FTS5 virtual table for full-text search on entries
        CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
            title,
            description,
            content='entries',
            content_rowid='id'
        );
        
        -- Trigger to insert into FTS when entry is created
        CREATE TRIGGER IF NOT EXISTS entries_fts_insert AFTER INSERT ON entries BEGIN
            INSERT INTO entries_fts(rowid, title, description)
            VALUES (new.id, new.title, COALESCE(new.description, ''));
        END;
        
        -- Trigger to delete from FTS when entry is deleted
        CREATE TRIGGER IF NOT EXISTS entries_fts_delete AFTER DELETE ON entries BEGIN
            INSERT INTO entries_fts(entries_fts, rowid, title, description)
            VALUES ('delete', old.id, old.title, COALESCE(old.description, ''));
        END;
        
        -- Trigger to update FTS when entry is updated
        CREATE TRIGGER IF NOT EXISTS entries_fts_update AFTER UPDATE ON entries BEGIN
            INSERT INTO entries_fts(entries_fts, rowid, title, description)
            VALUES ('delete', old.id, old.title, COALESCE(old.description, ''));
            INSERT INTO entries_fts(rowid, title, description)
            VALUES (new.id, new.title, COALESCE(new.description, ''));
        END;
        "#,
    ),
    (
        "006_populate_entries_fts",
        r#"
        -- Populate FTS index from existing entries
        INSERT INTO entries_fts(rowid, title, description)
        SELECT id, title, COALESCE(description, '') FROM entries
        WHERE id NOT IN (SELECT rowid FROM entries_fts);
        "#,
    ),
    (
        "007_add_entry_cover_image",
        r#"
        -- Add cover_image_path column to entries table
        ALTER TABLE entries ADD COLUMN cover_image_path TEXT;
        
        -- Create index for querying entries with/without cover images
        CREATE INDEX IF NOT EXISTS idx_entries_cover_image ON entries(cover_image_path);
        "#,
    ),
];

/// Runs all pending migrations.
pub async fn run_migrations(conn: &DatabaseConnection) -> AppResult<()> {
    log::info!("Running database migrations...");

    // Ensure migrations table exists first
    sea_orm::ConnectionTrait::execute_unprepared(
        conn,
        r#"
        CREATE TABLE IF NOT EXISTS _migrations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL UNIQUE,
            applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    )
    .await?;

    for (name, sql) in MIGRATIONS {
        // Check if migration was already applied
        let result = sea_orm::ConnectionTrait::query_one(
            conn,
            sea_orm::Statement::from_string(
                sea_orm::DatabaseBackend::Sqlite,
                format!("SELECT 1 FROM _migrations WHERE name = '{}'", name),
            ),
        )
        .await?;

        if result.is_some() {
            log::debug!("Migration '{}' already applied, skipping", name);
            continue;
        }

        log::info!("Applying migration: {}", name);

        // Run migration
        sea_orm::ConnectionTrait::execute_unprepared(conn, sql).await?;

        // Record migration
        sea_orm::ConnectionTrait::execute_unprepared(
            conn,
            &format!("INSERT INTO _migrations (name) VALUES ('{}')", name),
        )
        .await?;
    }

    log::info!("All migrations applied successfully");
    Ok(())
}
