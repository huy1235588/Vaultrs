# Change: Refactor Codebase for Modularization

## Why

The current codebase has grown organically and now exhibits several structural issues that impede maintainability:
- Frontend files are organized flat (api/, types/, stores/) rather than grouped by domain
- Backend `entry/service.rs` file is 871 lines with multiple responsibilities (CRUD, image handling, FTS search)
- Violates Single Responsibility Principle (SRP) making code harder to navigate and test independently

This refactoring improves code organization, maintainability, and aligns the codebase with the Modular Monolith Architecture defined in `project.md`.

## What Changes

### Backend (Rust - src-tauri/src/)

1. **Split EntryService** (SRP violation):
   - Extract `EntryImageService` for image-related operations (set_cover_from_file, set_cover_from_url, remove_cover, get_thumbnail)
   - Extract `EntrySearchService` for FTS search operations (search, build_fts_query)
   - Keep `EntryService` focused on CRUD operations only

2. **Rename for clarity**:
   - `field/` module → clearer documentation for FieldDefinition operations

### Frontend (React - src/)

1. **Reorganize to domain modules** (`src/modules/`):
   - Create `modules/vault/` containing: api, types, store, and re-export components
   - Create `modules/entry/` containing: api, types, store, and re-export components
   - Create `modules/field/` containing: api, types, store, and re-export components

2. **Keep shared resources**:
   - `components/ui/` - Shared UI primitives
   - `components/layout/` - Layout components  
   - `lib/` - Utility functions

3. **Update imports** throughout the codebase to use new module paths

## Impact

### Affected Specs
- None - this is a pure refactoring change with no behavioral modifications

### Affected Code

#### Backend (Rust/Tauri)
- `desktop/src-tauri/src/entry/service.rs` - Split into 3 service files
- `desktop/src-tauri/src/entry/mod.rs` - Update exports
- `desktop/src-tauri/src/lib.rs` - No changes (commands stay same)

#### Frontend (React/TypeScript)
- Create `desktop/src/modules/vault/` directory structure
- Create `desktop/src/modules/entry/` directory structure  
- Create `desktop/src/modules/field/` directory structure
- Move and reorganize existing files into module structure
- Update all imports in:
  - `desktop/src/App.tsx`
  - All component files
  - Store files that reference other stores

### Breaking Changes
None - this is a pure internal refactoring. No API changes, no behavior changes, no database changes.

### Risks
- Import path errors during migration (mitigated by TypeScript compilation)
- Circular dependency issues (mitigated by clear module boundaries)
