# Change: Add Vault Entry Search

## Why

Users need to quickly find entries within a vault when managing large collections. Currently, users must manually scroll through entries to find specific items, which is inefficient for vaults with hundreds or thousands of entries.

## What Changes

- Add SQLite FTS5 (Full-Text Search) virtual table for entry search
- Add search service in backend with optimized query handling
- Add Tauri command for searching entries within a vault
- Add search input component in vault header
- Implement debounced real-time search with filtered results display
- Update entry list to show filtered results when search is active

## Impact

- Affected specs: New capability `entry-search`
- Affected code:
  - Backend: `src-tauri/src/entry/` (new search service), migrations (FTS5 table)
  - Frontend: `src/components/` (SearchInput), `src/stores/entryStore.ts`, `src/api/entry.ts`

## Success Criteria

- Search query under 100ms for 10,000+ entries
- Real-time filtering as user types (debounced 300ms)
- Highlight matched terms in search results
- Clear search to restore full entry list
- Empty state when no results found

## Out of Scope

- Search across multiple vaults (global search)
- Search in custom field values (see idea.md for future enhancement)
- Advanced filters (date range, field-specific filters)
- Search history or saved searches
