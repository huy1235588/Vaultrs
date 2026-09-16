# Research: SeaORM SQLite Connection Teardown & WAL Truncation

**Ticket:** [Investigate SeaORM SQLite connection pool closing and WAL truncation in Rust](https://github.com/huy1235588/Vaultrs/issues/2)  
**Date:** 2026-09-16  
**Primary Sources:**
- SeaORM crate source (`sea_orm::database::db_connection::DatabaseConnection`, v1.1.20)
- SQLite Checkpoint documentation (`PRAGMA wal_checkpoint(TRUNCATE)`)

---

## Findings

### 1. SeaORM Explicit Connection Pool Shutdown
In SeaORM 1.1.20, `sea_orm::DatabaseConnection` provides two async methods for closing connections:
- `pub async fn close(self) -> Result<(), DbErr>`: Consumes the `DatabaseConnection` and delegates to `self.close_by_ref()`.
- `pub async fn close_by_ref(&self) -> Result<(), DbErr>`: Closes the underlying driver pool by reference. For the `sqlx-sqlite` feature, it matches `DatabaseConnection::SqlxSqlitePoolConnection(conn)` and calls `conn.close_by_ref().await`, which closes the inner `sqlx::SqlitePool`.
- Once closed, all pooled SQLite worker connections are terminated, and no new queries will be accepted on that pool.

### 2. SQLite WAL Checkpoint & File Lock Release on Windows
When SQLite runs in WAL mode (`PRAGMA journal_mode = WAL`), uncommitted or checkpointed pages remain in `{vault_root}/vaultrs.db-wal` and `{vault_root}/vaultrs.db-shm`. On Windows:
- Holding open file handles to SQLite databases or shared memory files prevents external file actions (moving, renaming, or deleting the vault folder in Windows Explorer).
- Running `PRAGMA wal_checkpoint(TRUNCATE);` before closing forces SQLite to:
  1. Transfer all committed frames from the WAL file back into the database file (`vaultrs.db`).
  2. Truncate the `.wal` file to zero bytes.
  3. Reset the shared memory header (`.shm`).

### 3. Execution Pattern via `ConnectionTrait`
SeaORM exposes `execute_unprepared` via `sea_orm::ConnectionTrait`:
```rust
use sea_orm::ConnectionTrait;

// 1. Truncate WAL to write all journal pages to main database file
db.execute_unprepared("PRAGMA wal_checkpoint(TRUNCATE);").await?;

// 2. Explicitly drain and close the connection pool
db.close().await?;
```

### 4. Implementation Recommendation for `AppVaultState`
In `desktop/src-tauri/src/core/state.rs`:
1. Update `close_vault(&self)` to take `self.db.write().await.take()`.
2. If an active connection exists:
   - Run `PRAGMA wal_checkpoint(TRUNCATE);` (ignoring failures if the connection was already aborted).
   - Call `old_db.close().await`.
3. In `init_vault(&self, vault_root: &Path)`:
   - Call `self.close_vault().await` before opening a new database, preventing concurrent connection pools and file lock retention across vault switches.
