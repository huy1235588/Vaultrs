# Tasks: Implement Core Vault & Entry CRUD

## 1. Backend Foundation

- [x] **1.1** Create `core` module with `AppError`, `AppResult` types, and shared utilities
- [x] **1.2** Create `db` module with SQLite connection setup and migration runner
- [x] **1.3** Write SQL migrations for `vaults` and `entries` tables
- [x] **1.4** Generate SeaORM entities from database schema

**Validation**: Run `cargo build` - should compile without errors ✅

## 2. Vault Service Layer

- [x] **2.1** Create `vault` module structure: `mod.rs`, `model.rs`, `service.rs`
- [x] **2.2** Implement `VaultService` with CRUD operations:
  - `create_vault(name, description) -> Vault`
  - `get_vault(id) -> Vault`
  - `list_vaults() -> Vec<Vault>`
  - `update_vault(id, updates) -> Vault`
  - `delete_vault(id) -> ()`
- [x] **2.3** Write unit tests for `VaultService`

**Validation**: Run `cargo test vault` - all tests should pass ✅

## 3. Entry Service Layer

- [x] **3.1** Create `entry` module structure: `mod.rs`, `model.rs`, `service.rs`
- [x] **3.2** Implement `EntryService` with CRUD + pagination:
  - `create_entry(vault_id, title, description) -> Entry`
  - `get_entry(id) -> Entry`
  - `list_entries(vault_id, page, limit) -> PaginatedEntries`
  - `update_entry(id, updates) -> Entry`
  - `delete_entry(id) -> ()`
  - `count_entries(vault_id) -> i64`
- [x] **3.3** Write unit tests for `EntryService`

**Validation**: Run `cargo test entry` - all tests should pass ✅

## 4. Tauri Command Layer

- [x] **4.1** Create `commands` module organizing all IPC endpoints
- [x] **4.2** Implement vault commands: `create_vault`, `get_vault`, `list_vaults`, `update_vault`, `delete_vault`
- [x] **4.3** Implement entry commands: `create_entry`, `get_entry`, `list_entries`, `update_entry`, `delete_entry`, `count_entries`
- [x] **4.4** Register all commands in `lib.rs` with `invoke_handler`
- [x] **4.5** Setup app state with database connection pool

**Validation**: Run `pnpm tauri dev` - app should start without errors ✅

## 5. Frontend Foundation

- [x] **5.1** Create TypeScript types matching Rust models (`types/vault.ts`, `types/entry.ts`)
- [x] **5.2** Create API layer with type-safe Tauri command wrappers (`api/vault.ts`, `api/entry.ts`)
- [x] **5.3** Create Zustand stores (`stores/vaultStore.ts`, `stores/entryStore.ts`)
- [x] **5.4** Setup routing with React Router or simple state-based navigation

**Validation**: Run `pnpm type-check` - no TypeScript errors ✅

## 6. Layout & Navigation

- [x] **6.1** Create `MainLayout` component with sidebar and content area
- [x] **6.2** Create `Sidebar` component showing vault list
- [x] **6.3** Create `VaultListItem` component with selection state
- [x] **6.4** Implement vault selection behavior (click to view entries)

**Validation**: Run `pnpm tauri dev` - layout renders correctly ✅

## 7. Vault Management UI

- [x] **7.1** Create `CreateVaultDialog` component with form
- [x] **7.2** Create `VaultHeader` component showing active vault info
- [x] **7.3** Implement create vault flow (dialog → API → store update → UI refresh)
- [x] **7.4** Add empty state when no vaults exist

**Validation**: Can create a vault and see it in sidebar ✅

## 8. Entry List with Virtual Scrolling

- [x] **8.1** Create `EntryList` component with TanStack Virtual setup
- [x] **8.2** Create `EntryRow` component for individual entries
- [x] **8.3** Implement infinite scroll / pagination (load more on scroll)
- [x] **8.4** Add loading states and skeleton placeholders
- [x] **8.5** Add empty state when no entries exist

**Validation**: Scroll through 1000+ entries at 60 FPS ✅

## 9. Entry Management UI

- [x] **9.1** Create `CreateEntryDialog` component with form
- [x] **9.2** Implement create entry flow (dialog → API → store update → list refresh)
- [x] **9.3** Add entry count display in vault header

**Validation**: Can create entries and see them in the list immediately ✅

## 10. Integration Testing & Polish

- [ ] **10.1** Manual test: Create vault → Add 100 entries → Scroll → Delete entry → Delete vault
- [ ] **10.2** Test with large dataset: Insert 10,000 entries and verify smooth scrolling
- [ ] **10.3** Fix any UI/UX issues discovered during testing
- [x] **10.4** Update README with development instructions

**Validation**: Full workflow works end-to-end with no errors

---

## Dependencies

```
1.x (Backend Foundation) - required for all other backend tasks
    ↓
2.x, 3.x (Services) - can run in parallel
    ↓
4.x (Tauri Commands) - requires 2.x and 3.x
    ↓
5.x (Frontend Foundation) - requires 4.x for types
    ↓
6.x, 7.x, 8.x, 9.x (UI) - mostly parallel with dependencies on 5.x
    ↓
10.x (Integration) - requires all above
```

## Notes

- Tasks 2.x and 3.x can be worked on in parallel
- Tasks 6.x, 7.x, 8.x can be partially parallel after 5.x is complete
- Each task group has its own validation checkpoint
