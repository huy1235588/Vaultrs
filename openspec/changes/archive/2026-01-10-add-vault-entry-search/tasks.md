# Tasks: Add Vault Entry Search

## 1. Database Schema

- [x] **1.1** Write SQL migration for FTS5 virtual table `entries_fts`
- [x] **1.2** Write SQL migration for sync triggers (INSERT, UPDATE, DELETE)
- [x] **1.3** Write SQL migration to populate FTS index from existing entries
- [x] **1.4** Run migration and verify FTS table is created

**Validation**: Run `cargo build` and verify migrations apply without errors ✅

## 2. Backend Search Service

- [x] **2.1** Create `SearchResult` struct in `entry/model.rs`
- [x] **2.2** Add `search_entries(vault_id, query, page, limit)` method to `EntryService`
- [x] **2.3** Implement FTS5 query with MATCH syntax and result highlighting
- [x] **2.4** Add pagination support for search results
- [x] **2.5** Write unit tests for search service

**Validation**: Run `cargo test search` - all tests pass ✅

## 3. Tauri Command

- [x] **3.1** Create `search_entries` command in `commands/entry.rs`
- [x] **3.2** Register command in `lib.rs` invoke_handler
- [x] **3.3** Test command via Tauri dev tools - App runs successfully

**Validation**: Run `pnpm tauri dev` - command callable from frontend ✅

## 4. Frontend Types & API

- [x] **4.1** Add `SearchResult` type to `types/entry.ts`
- [x] **4.2** Add `searchEntries` function to `api/entry.ts`
- [x] **4.3** Update `entryStore.ts` with search state:
  - `searchQuery: string`
  - `searchResults: Entry[]`
  - `isSearching: boolean`
  - `setSearchQuery(query)` action
  - `clearSearch()` action

**Validation**: Run `pnpm type-check` - no TypeScript errors ✅

## 5. Search Input Component

- [x] **5.1** Create `SearchInput` component with:
  - Text input with search icon
  - Clear button (X) when query exists
  - Loading indicator during search
- [x] **5.2** Implement debounced search (300ms delay)
- [x] **5.3** Add keyboard shortcuts (Escape to clear, Ctrl+F to focus)
- [x] **5.4** Style component to match existing design system

**Validation**: SearchInput renders and triggers debounced callbacks ✅

## 6. Entry List Integration

- [x] **6.1** Add `SearchInput` to `VaultHeader` component
- [x] **6.2** Update `EntryList` to use `searchResults` when `searchQuery` is set
- [x] **6.3** Add "No results found" empty state with search query display
- [x] **6.4** Add search result count display (e.g., "Found 42 entries")
- [x] **6.5** Ensure virtual scrolling works with filtered results

**Validation**: Search filters entries in real-time ✅

## 7. Result Highlighting (Optional Enhancement)

- [x] **7.1** Extract highlight snippets from FTS5 results - Implemented on frontend using search query
- [x] **7.2** Create `HighlightText` component to render matched terms
- [x] **7.3** Update `EntryRow` to use highlighting when in search mode

**Validation**: Matched terms are visually highlighted ✅

## 8. Integration Testing & Polish

- [x] **8.1** Test: Search → Find entries → Clear → Full list restored
- [x] **8.2** Test: Search with no results → Empty state shown
- [x] **8.3** Test: Search performance with 1000+ entries - Virtual scrolling maintained
- [x] **8.4** Fix any UI/UX issues discovered during testing - Clear search on vault change
- [x] **8.5** Update project documentation

**Validation**: Full search workflow works end-to-end ✅

---

## Dependencies

```
1.x (Database) - foundation for search
    ↓
2.x (Backend Service) - requires database schema
    ↓
3.x (Tauri Command) - requires service
    ↓
4.x (Frontend Types/API) - requires command
    ↓
5.x, 6.x (UI Components) - can run in parallel after 4.x
    ↓
7.x (Highlighting) - optional, after 6.x
    ↓
8.x (Integration) - requires all above
```

## Notes

- Tasks 5.x and 6.x can be partially parallel after 4.x is complete
- Task 7.x (highlighting) is optional enhancement, can be deferred
- FTS5 migration should be non-destructive and additive
- Existing entry tests should continue to pass
