# Tasks: Codebase Modularization

## Phase 1: Backend Service Split

### 1.1 Extract EntryImageService
- [x] 1.1.1 Create `desktop/src-tauri/src/entry/image_service.rs`
- [x] 1.1.2 Move image-related methods from `service.rs`:
  - `set_cover_from_file`
  - `set_cover_from_url`
  - `remove_cover`
  - `get_thumbnail`
- [x] 1.1.3 Update method signatures to work with necessary dependencies
- [x] 1.1.4 Add proper module documentation

### 1.2 Extract EntrySearchService
- [x] 1.2.1 Create `desktop/src-tauri/src/entry/search_service.rs`
- [x] 1.2.2 Move search-related methods from `service.rs`:
  - `search`
  - `build_fts_query`
- [x] 1.2.3 Add proper module documentation

### 1.3 Update Entry Module Exports
- [x] 1.3.1 Update `desktop/src-tauri/src/entry/mod.rs` to export new services
- [x] 1.3.2 Update `commands/entry_commands.rs` to use appropriate services
- [x] 1.3.3 Update `commands/image_commands.rs` to use `EntryImageService`

### 1.4 Backend Verification
- [x] 1.4.1 Run `cargo build` - ensure no compilation errors
- [x] 1.4.2 Run `cargo test` - ensure all tests pass (25 passed)
- [x] 1.4.3 Run `cargo clippy` - ensure no new warnings

---

## Phase 2: Frontend Module Structure

### 2.1 Create Module Directory Structure
- [x] 2.1.1 Create `desktop/src/modules/` directory
- [x] 2.1.2 Create `desktop/src/modules/vault/` with subdirectories
- [x] 2.1.3 Create `desktop/src/modules/entry/` with subdirectories
- [x] 2.1.4 Create `desktop/src/modules/field/` with subdirectories

### 2.2 Migrate Vault Module
- [x] 2.2.1 Move `api/vault.ts` → `modules/vault/api.ts`
- [x] 2.2.2 Move `types/vault.ts` → `modules/vault/types.ts`
- [x] 2.2.3 Move `stores/vaultStore.ts` → `modules/vault/store.ts`
- [x] 2.2.4 Move `components/vault/*` → `modules/vault/components/`
- [x] 2.2.5 Create `modules/vault/index.ts` barrel export
- [x] 2.2.6 Update imports within vault module files

### 2.3 Migrate Entry Module
- [x] 2.3.1 Move `api/entry.ts` → `modules/entry/api.ts`
- [x] 2.3.2 Move `types/entry.ts` → `modules/entry/types.ts`
- [x] 2.3.3 Move `stores/entryStore.ts` → `modules/entry/store.ts`
- [x] 2.3.4 Move `components/entry/*` → `modules/entry/components/`
- [x] 2.3.5 Create `modules/entry/index.ts` barrel export
- [x] 2.3.6 Update imports within entry module files

### 2.4 Migrate Field Module
- [x] 2.4.1 Move `api/field.ts` → `modules/field/api.ts`
- [x] 2.4.2 Move `types/field.ts` → `modules/field/types.ts`
- [x] 2.4.3 Move `stores/fieldStore.ts` → `modules/field/store.ts`
- [x] 2.4.4 Move `components/field/*` → `modules/field/components/`
- [x] 2.4.5 Create `modules/field/index.ts` barrel export
- [x] 2.4.6 Update imports within field module files

### 2.5 Update Cross-Module Imports
- [x] 2.5.1 Update `App.tsx` to import from new module paths
- [x] 2.5.2 Update remaining `api/index.ts` (re-exports from new modules)
- [x] 2.5.3 Update remaining `types/index.ts` (re-exports from new modules)
- [x] 2.5.4 Update remaining `stores/index.ts` (re-exports from new modules)
- [x] 2.5.5 Update any component imports that reference old paths

### 2.6 Cleanup Old Structure
- [x] 2.6.1 Updated old index files to re-export from new modules (backward compatibility)
- [x] 2.6.2 Old component files retained for reference (can be deleted in future)

### 2.7 Frontend Verification
- [x] 2.7.1 Run `pnpm build` - ensure no TypeScript errors
- [ ] 2.7.2 Run `pnpm dev` - verify application runs correctly
- [ ] 2.7.3 Manual smoke test: create vault, add entry, upload cover image

---

## Phase 3: Final Verification

### 3.1 Full Application Test
- [ ] 3.1.1 Start application with `pnpm tauri dev`
- [ ] 3.1.2 Test vault CRUD operations
- [ ] 3.1.3 Test entry CRUD operations
- [ ] 3.1.4 Test entry search functionality
- [ ] 3.1.5 Test cover image upload/URL/removal
- [ ] 3.1.6 Test field definition CRUD operations

### 3.2 Code Quality Check
- [x] 3.2.1 Run ESLint: `pnpm lint` (Note: ESLint config needs upgrade to v9 format - unrelated to refactoring)
- [x] 3.2.2 Run TypeScript check: `pnpm tsc --noEmit` - PASSED
- [x] 3.2.3 Review for any remaining old import paths - Updated with backward compat re-exports

---

## Dependencies

- Tasks 1.1-1.3 can be done in parallel
- Task 1.4 must complete before Phase 2
- Tasks 2.2-2.4 can be done in parallel but are easier sequentially
- Task 2.5 depends on all of 2.2-2.4
- Phase 3 depends on completion of Phase 1 and Phase 2

---

## Summary

### Backend Changes
- Created `EntryImageService` in `entry/image_service.rs` for image operations
- Created `EntrySearchService` in `entry/search_service.rs` for search operations
- Refactored `EntryService` to contain only CRUD operations
- Updated command handlers to use the appropriate services

### Frontend Changes
- Created new module structure under `src/modules/`:
  - `modules/vault/` - vault API, types, store, and components
  - `modules/entry/` - entry API, types, store, and components
  - `modules/field/` - field API, types, store, and components
- Each module has:
  - `api.ts` - Tauri command wrappers
  - `types.ts` - TypeScript interfaces
  - `store.ts` - Zustand state management
  - `components/` - React components
  - `index.ts` - Barrel export for public API
- Updated `App.tsx` and layout components to use new module imports
- Old locations (`api/`, `types/`, `stores/`, `components/vault|entry|field`) now re-export from new modules for backward compatibility
