# Tasks: Cross-Vault Reference

## Phase 1: Backend Foundation

### 1.1 Field Type Extension

-   [x] Add `Relation` variant to `FieldType` enum in `field/model.rs`
-   [x] Add `as_str()` and `from_str()` implementations for "relation"
-   [x] Extend `FieldOptions` with `target_vault_id: Option<i32>` and `display_fields: Option<Vec<String>>`
-   [x] Add validation in `FieldService` to verify `target_vault_id` exists when creating relation field

### 1.2 Relation DTOs

-   [x] Create `RelationValue` struct (`entry_id`, `vault_id`)
-   [x] Create `RelationRef` struct for batch resolution requests
-   [x] Create `ResolvedRelation` struct with `exists` flag
-   [x] Create `EntryPickerItem` struct for search results

### 1.3 Relation Service

-   [x] Create `RelationService` module in `src-tauri/src/`
-   [x] Implement `resolve_single()` function
-   [x] Implement `resolve_batch()` function with HashMap return
-   [x] Handle deleted entry case (return `exists: false`)

### 1.4 New Commands

-   [x] Add `search_entries_for_relation` command (search by title in target vault)
-   [x] Add `resolve_relations` command (batch resolve)
-   [x] Register commands in `lib.rs`

### 1.5 Entry Service Updates

-   [ ] Add `resolve_relations` parameter to `get_entry` command
-   [ ] Update entry response to include resolved relations when requested

---

## Phase 2: Frontend Components

### 2.1 Type Definitions

-   [x] Add `RelationValue` type to TypeScript definitions
-   [x] Add `ResolvedRelation` type
-   [x] Add `EntryPickerItem` type
-   [x] Extend `FieldOptions` type with `targetVaultId`

### 2.2 API Integration

-   [x] Add `searchEntriesForRelation()` API function
-   [x] Add `resolveRelations()` API function
-   [ ] Update `getEntry()` to accept `resolveRelations` flag

### 2.3 RelationFieldEditor Component

-   [x] Create `RelationFieldEditor.tsx` in `modules/field/components/`
-   [x] Implement search input with debounce
-   [x] Implement dropdown list with entry picker items
-   [x] Implement selection and clear functionality
-   [x] Handle loading and empty states

### 2.4 RelationFieldDisplay Component

-   [x] Create `RelationFieldDisplay.tsx` in `modules/field/components/`
-   [x] Display resolved entry info (title, thumbnail)
-   [x] Show "[Deleted Entry]" for non-existent references
-   [x] Implement click handler for navigation

### 2.5 Form Integration

-   [x] Update field renderer to handle `relation` type
-   [x] Pass `targetVaultId` from field options to editor
-   [x] Update form submission to include relation values

### 2.6 Navigation

-   [ ] Create `useRelationNavigation` hook
-   [x] Implement navigation to target entry/vault (via onNavigate prop)
-   [ ] Handle cross-vault navigation state

---

## Phase 3: Detail View Integration

### 3.1 Entry Detail Updates

-   [ ] Fetch entry with `resolveRelations: true`
-   [x] Render `RelationFieldDisplay` for relation fields
-   [x] Wire up navigation on click (via onNavigateToEntry prop)

### 3.2 Entry List Updates

-   [ ] Add optional batch resolution for visible entries
-   [ ] Display relation preview in table cell (if configured)

---

## Phase 4: Data Integrity

### 4.1 Validation

-   [x] Validate `target_vault_id` when creating/updating relation field
-   [ ] Show warning when deleting vault that is referenced by relation fields
-   [x] Validate relation value format on entry save

### 4.2 Edge Cases

-   [x] Handle deleted target entry gracefully
-   [x] Handle deleted target vault gracefully
-   [ ] Test circular reference scenario

---

## Phase 5: Testing

### 5.1 Backend Tests

-   [ ] Unit test: `FieldType::Relation` serialization
-   [ ] Unit test: `ResolvedRelation` with deleted entry
-   [ ] Integration test: Create relation field → create entry with relation → resolve

### 5.2 Frontend Tests

-   [ ] Component test: `RelationFieldEditor` search and select
-   [ ] Component test: `RelationFieldDisplay` states (loading, exists, deleted)
-   [ ] E2E test: Full flow from schema to entry creation to navigation

---

## Definition of Done

-   [ ] All tasks marked complete
-   [ ] Manual testing passed for all user stories
-   [ ] No regressions in existing field types
-   [ ] Documentation updated (if needed)
-   [ ] Code reviewed and approved

---

_Created: 2026-02-01_
_Updated: 2026-02-01_
