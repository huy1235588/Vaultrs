# Trigger-Synchronized SQLite FTS5 Full-Text Search

Vaultrs requires responsive, ranked full-text search across all items and collections without running separate server processes or indexing background daemons. We decided to use an external content SQLite FTS5 virtual table (`items_fts`) synchronized directly via SQLite triggers (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE` on the `items` table). This guarantees zero indexing drift, provides transactional search consistency immediately upon item mutation, and avoids the operational complexity of background worker queues.

## Considered Options

- **External Search Engine (e.g., Meilisearch, Sonic)**: Powerful search capabilities, but violates the self-contained, zero-dependency desktop model and inflates memory footprint.
- **Application-Level Async Indexing Worker**: A background Tokio task listening for item changes. Rejected due to eventual consistency lag, potential index drift on abrupt process shutdown, and synchronization state overhead.
- **Trigger-Synchronized SQLite FTS5**: Chosen because SQLite write operations in WAL mode are already serialized, and maintaining FTS5 within the exact same transaction guarantees immediate ACID consistency with minimal write overhead.
