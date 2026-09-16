# Embedded SQLite in WAL Mode with Tauri v2

Vaultrs requires high-performance, offline-capable metadata management with zero cloud or server dependencies, targeting 10M+ records on consumer machines. We decided to build on Tauri v2 with an embedded SQLite engine configured in WAL (Write-Ahead Logging) mode rather than shipping a background database daemon or relying on cloud storage. This gives the desktop app a minimal binary footprint, zero-configuration portability, and concurrent non-blocking reads alongside writes directly over Tauri IPC.

## Considered Options

- **Client-Server Relational DB (e.g., PostgreSQL)**: Rejected due to heavy background service footprint, installation friction, and failure to meet the single-file offline desktop goal.
- **Embedded Key-Value / Document Store (RocksDB, Sled)**: Fast raw I/O, but lacks built-in relational constraints, structured JSON query support, and SQLite's mature FTS5 text search.
- **Embedded SQLite (WAL Mode)**: Chosen for single-file storage, zero operational overhead, ACID durability, and fast concurrent read throughput under heavy UI queries.
