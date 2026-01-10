# Design: Add Vault Entry Search

## Context

Vaultrs needs efficient search capability to handle large collections (10,000+ entries per vault). Users expect instant feedback when searching, similar to modern applications. The search must integrate seamlessly with the existing virtual scrolling implementation.

### Constraints

- Must maintain 60 FPS scrolling during search
- Query time target: < 100ms for 10,000 entries
- SQLite only (no external search engines)
- Must work offline

## Goals / Non-Goals

### Goals

- Fast full-text search on entry title and description
- Real-time filtering with debounced input
- Clean integration with existing entry list UI
- Maintain virtual scrolling performance

### Non-Goals

- Global search across all vaults
- Search in custom field values (future enhancement)
- Fuzzy/typo-tolerant search
- Search ranking/relevance scoring

## Decisions

### Decision 1: Use SQLite FTS5

**What:** Create FTS5 virtual table for full-text search indexing.

**Why:**
- FTS5 is built into SQLite, no external dependencies
- Optimized for full-text queries with prefix matching
- Supports incremental updates (insert/update/delete triggers)
- Can handle millions of rows efficiently

**Alternatives considered:**
- **LIKE queries**: Simple but O(n) scan, too slow for large datasets
- **Application-level search**: Requires loading all entries into memory
- **External search (Meilisearch/Tantivy)**: Overkill for single-user desktop app

### Decision 2: Debounced Real-Time Search

**What:** Search triggers 300ms after user stops typing.

**Why:**
- Reduces unnecessary queries while user is still typing
- Provides responsive feel without overwhelming the database
- 300ms is standard UX pattern for search inputs

### Decision 3: Filter Mode vs Search Results View

**What:** Search filters the current entry list instead of showing a separate results view.

**Why:**
- Maintains spatial context (user sees filtered list in familiar layout)
- Simpler UX - no mode switching or navigation
- Works naturally with virtual scrolling
- Easy to clear and return to full list

## Database Schema

### FTS5 Virtual Table

```sql
-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE entries_fts USING fts5(
    title,
    description,
    content='entries',
    content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER entries_ai AFTER INSERT ON entries BEGIN
    INSERT INTO entries_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER entries_ad AFTER DELETE ON entries BEGIN
    INSERT INTO entries_fts(entries_fts, rowid, title, description)
    VALUES ('delete', old.id, old.title, old.description);
END;

CREATE TRIGGER entries_au AFTER UPDATE ON entries BEGIN
    INSERT INTO entries_fts(entries_fts, rowid, title, description)
    VALUES ('delete', old.id, old.title, old.description);
    INSERT INTO entries_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;
```

## API Design

### Backend Service

```rust
// entry/search.rs
pub struct SearchResult {
    pub entries: Vec<EntryDto>,
    pub total: i64,
    pub query: String,
}

impl EntryService {
    pub async fn search_entries(
        &self,
        vault_id: i32,
        query: &str,
        page: u64,
        limit: u64,
    ) -> AppResult<SearchResult>;
}
```

### Tauri Command

```rust
#[tauri::command]
pub async fn search_entries(
    state: tauri::State<'_, AppState>,
    vault_id: i32,
    query: String,
    page: u64,
    limit: u64,
) -> Result<SearchResult, String>;
```

### Frontend API

```typescript
// api/entry.ts
export async function searchEntries(
    vaultId: number,
    query: string,
    page: number,
    limit: number
): Promise<SearchResult>;

// types/entry.ts
interface SearchResult {
    entries: Entry[];
    total: number;
    query: string;
}
```

## Component Architecture

```
VaultHeader
└── SearchInput (debounced input, clear button)

EntryList
├── uses searchQuery from entryStore
├── shows filtered results when searchQuery is set
├── shows "No results" empty state
└── maintains virtual scrolling

entryStore
├── searchQuery: string
├── searchResults: Entry[]
├── isSearching: boolean
├── setSearchQuery(query)
└── clearSearch()
```

## Risks / Trade-offs

### Risk 1: FTS Index Size

**Risk:** FTS5 index can grow large with many entries.
**Mitigation:** Acceptable trade-off for search performance. SQLite handles this well.

### Risk 2: Search During Heavy Writes

**Risk:** Triggers slow down bulk insert operations.
**Mitigation:** Future optimization: batch inserts with deferred indexing.

## Migration Plan

1. Add FTS5 table migration (non-destructive)
2. Populate FTS index from existing entries (one-time)
3. Deploy backend changes
4. Deploy frontend changes
5. No rollback needed (FTS table is supplementary)

## Open Questions

- [ ] Should we support prefix search (e.g., "app*" matches "apple")?
  - **Decision:** Yes, use FTS5 prefix queries for better UX
- [ ] Should search be case-insensitive?
  - **Decision:** Yes, FTS5 default tokenizer handles this
