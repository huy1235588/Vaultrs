# Change: Implement Core Vault & Entry CRUD with Virtual Scrolling

## Why

The project is currently at the Planning & Design phase with only boilerplate code. To validate the architecture and provide a working foundation, we need to implement the core data management capabilities: creating vaults, adding entries, and displaying large datasets efficiently with virtual scrolling.

This is the **minimal viable vertical slice** that demonstrates the full stack working together: SQLite → SeaORM → Rust Services → Tauri IPC → React UI → TanStack Virtual.

## What Changes

### Backend (Rust)
- **Database Layer**: SQLite schema with `vaults` and `entries` tables using EAV pattern for flexible fields
- **Core Module**: Error types, result aliases, and shared utilities
- **Vault Service**: CRUD operations for vault/collection management
- **Entry Service**: CRUD operations for entries within vaults with pagination support
- **Tauri Commands**: IPC layer exposing services to frontend

### Frontend (React)
- **Store Layer**: Zustand stores for vault and entry state management
- **Tauri API Layer**: Type-safe wrappers for Tauri commands
- **Layout**: Main application layout with sidebar and content area
- **Vault Management UI**: Create, list, and select vaults
- **Entry List UI**: Virtual scrolling list for 10M+ entries with TanStack Virtual

## Impact

- **Affected specs**:
  - `vault-management` (NEW) - Vault CRUD operations
  - `entry-management` (NEW) - Entry CRUD operations
  - `virtual-scrolling` (NEW) - Large dataset display

- **Affected code**:
  - `src-tauri/src/` - New modules: `core/`, `vault/`, `entry/`, `db/`
  - `src/` - New modules: `stores/`, `api/`, `components/`, `pages/`

## Success Criteria

1. User can create a new vault with a name and description
2. User can add entries to a vault with basic fields (title, description)
3. Entry list displays smoothly with 60 FPS scrolling for 10K+ entries
4. All operations persist to SQLite database
5. Application works fully offline
