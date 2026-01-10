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
