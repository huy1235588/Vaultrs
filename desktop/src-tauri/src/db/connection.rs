//! SQLite database connection with WAL mode.

use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};
use sea_orm_migration::MigratorTrait;
use std::path::Path;
use std::time::Duration;

use super::migrations::Migrator;

/// Initialize the database connection and run pending migrations.
///
/// This function:
/// 1. Creates the database file if it doesn't exist
/// 2. Connects with WAL mode enabled
/// 3. Runs all pending migrations
/// 4. Configures SQLite pragmas for optimal performance
pub async fn init_database(db_path: &Path) -> Result<DatabaseConnection, DbErr> {
    // Ensure the parent directory exists
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| DbErr::Custom(format!("Failed to create data directory: {e}")))?;
    }

    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let mut opt = ConnectOptions::new(&db_url);
    opt.max_connections(5)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(300))
        .sqlx_logging(cfg!(debug_assertions));

    let db = Database::connect(opt).await?;

    // Configure SQLite for performance
    configure_sqlite(&db).await?;

    // Run pending migrations
    Migrator::up(&db, None).await?;

    log::info!("Database initialized at: {}", db_path.display());

    Ok(db)
}

/// Configure SQLite pragmas for optimal performance.
async fn configure_sqlite(db: &DatabaseConnection) -> Result<(), DbErr> {
    use sea_orm::ConnectionTrait;
    use sea_orm::Statement;

    let pragmas = [
        "PRAGMA journal_mode = WAL",
        "PRAGMA synchronous = NORMAL",
        "PRAGMA foreign_keys = ON",
        "PRAGMA busy_timeout = 5000",
        "PRAGMA cache_size = -20000", // 20MB cache
        "PRAGMA temp_store = MEMORY",
    ];

    for pragma in &pragmas {
        db.execute(Statement::from_string(
            sea_orm::DatabaseBackend::Sqlite,
            pragma.to_string(),
        ))
        .await?;
    }

    log::info!("SQLite configured: WAL mode, foreign keys ON, 20MB cache");

    Ok(())
}
