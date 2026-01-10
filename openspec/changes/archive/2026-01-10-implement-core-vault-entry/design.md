# Design: Core Vault & Entry Implementation

## Context

Vaultrs is a desktop application for managing large-scale personal collections. This design covers the foundational architecture for the first working vertical slice.

### Stakeholders
- Single desktop user (no multi-user support needed)
- Developer (learning Rust/Tauri patterns)

### Constraints
- Must handle 10M+ records with 60 FPS scrolling
- Fully offline operation
- SQLite as embedded database (WAL mode)
- Cross-platform (Windows, macOS, Linux)

## Goals / Non-Goals

### Goals
- Establish clean modular architecture (Repository + Service pattern)
- Implement basic CRUD for vaults and entries
- Demonstrate virtual scrolling with large datasets
- Create type-safe IPC layer between Rust and React

### Non-Goals
- Custom fields/EAV implementation (future enhancement)
- Full-text search (future enhancement)
- Background crawling (future enhancement)
- Import/Export functionality (future enhancement)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Stores    │  │  Components │  │   TanStack Virtual  │  │
│  │  (Zustand)  │  │  (Shadcn)   │  │   (10M+ entries)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └────────────────┴───────────────────┬┘             │
│                                              │              │
│  ┌───────────────────────────────────────────┴────────────┐ │
│  │                    API Layer                           │ │
│  │        (Type-safe Tauri command wrappers)              │ │
│  └───────────────────────────────────────────┬────────────┘ │
└──────────────────────────────────────────────┼──────────────┘
                                               │ IPC (invoke)
┌──────────────────────────────────────────────┼──────────────┐
│                    BACKEND (Rust)            │              │
│  ┌───────────────────────────────────────────┴────────────┐ │
│  │                 Tauri Commands                         │ │
│  │     (#[tauri::command] - IPC endpoints)                │ │
│  └───────────────────────────────────────────┬────────────┘ │
│                                              │              │
│  ┌─────────────────┐    ┌────────────────────┴───────────┐ │
│  │   Core Module   │    │         Service Layer          │ │
│  │  - AppError     │    │  - VaultService                │ │
│  │  - Result<T>    │    │  - EntryService                │ │
│  │  - Config       │    │  (Business logic)              │ │
│  └─────────────────┘    └────────────────────┬───────────┘ │
│                                              │              │
│  ┌───────────────────────────────────────────┴────────────┐ │
│  │                 Repository Layer                       │ │
│  │     (SeaORM entities + database operations)            │ │
│  └───────────────────────────────────────────┬────────────┘ │
│                                              │              │
│  ┌───────────────────────────────────────────┴────────────┐ │
│  │                    SQLite (WAL)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Decisions

### Decision 1: Database Schema Design

**Choice**: Simple relational schema with JSON column for future flexibility

```sql
-- vaults table
CREATE TABLE vaults (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    icon        TEXT,
    color       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- entries table
CREATE TABLE entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_id    INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    metadata    TEXT,  -- JSON for future custom fields
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX idx_entries_vault_id ON entries(vault_id);
CREATE INDEX idx_entries_created_at ON entries(created_at);
```

**Rationale**: 
- Start simple, add complexity (EAV) when needed
- JSON column provides flexibility without schema migrations
- Indexes optimize common queries (by vault, by date)

**Alternatives considered**:
- Full EAV pattern: Too complex for MVP, adds query overhead
- NoSQL (SQLite JSON): Less query flexibility

### Decision 2: State Management

**Choice**: Zustand with separate stores per domain

```typescript
// Vault store
useVaultStore: { vaults, activeVaultId, actions }

// Entry store  
useEntryStore: { entries, pagination, actions }
```

**Rationale**:
- Simple API, minimal boilerplate
- Built-in persistence support
- Easy to test and debug

### Decision 3: Virtual Scrolling Strategy

**Choice**: TanStack Virtual with windowed rendering

**Configuration**:
- Estimated row height: 60px
- Overscan: 5 items (render 5 extra items above/below viewport)
- Initial load: 100 entries
- Fetch more: When scrolling near end

**Rationale**:
- TanStack Virtual is battle-tested for large datasets
- Works seamlessly with TanStack Table (future data grid features)
- Supports variable row heights if needed

### Decision 4: Error Handling

**Choice**: Centralized error types with thiserror

```rust
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),
    
    #[error("Vault not found: {0}")]
    VaultNotFound(i32),
    
    #[error("Entry not found: {0}")]
    EntryNotFound(i32),
    
    #[error("Validation error: {0}")]
    Validation(String),
}
```

**Rationale**:
- Type-safe error handling
- Easy to convert to frontend-friendly messages
- Supports error chaining

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large entry counts may slow queries | Use pagination + indexes; test with 10K+ entries early |
| SeaORM learning curve | Start with simple queries, add complexity gradually |
| Virtual scrolling performance | Profile with realistic data; tune overscan if needed |
| Schema changes down the road | JSON column provides flexibility; migrations are acceptable |

## Migration Plan

Not applicable - this is the initial implementation. No existing data to migrate.

## Open Questions

1. ~~EAV vs JSON for custom fields~~ → **Decided**: JSON column for MVP
2. ~~State management library~~ → **Decided**: Zustand
3. Should we include basic search in MVP? → **No, defer to future enhancement**
