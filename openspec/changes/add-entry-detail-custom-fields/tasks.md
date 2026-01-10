# Tasks: Add Entry Detail View & Custom Fields

## 1. Database Schema

- [ ] **1.1** Write SQL migration for `field_definitions` table
- [ ] **1.2** Generate SeaORM entity for `field_definitions`
- [ ] **1.3** Add index on `field_definitions(vault_id)`

**Validation**: Run `cargo build` and verify entities compile ✅

## 2. Field Definition Backend

- [ ] **2.1** Create `field` module structure: `mod.rs`, `model.rs`, `service.rs`
- [ ] **2.2** Define DTOs: `FieldDefinitionDto`, `CreateFieldDto`, `UpdateFieldDto`
- [ ] **2.3** Implement `FieldService` with CRUD operations:
  - `create_field(vault_id, name, field_type, options, required) -> FieldDefinition`
  - `list_fields(vault_id) -> Vec<FieldDefinition>`
  - `update_field(id, updates) -> FieldDefinition`
  - `delete_field(id) -> ()`
  - `reorder_fields(vault_id, ids[]) -> ()`
- [ ] **2.4** Add field type validation (name uniqueness, valid field_type enum)
- [ ] **2.5** Write unit tests for `FieldService`

**Validation**: Run `cargo test field` - all tests pass ✅

## 3. Field Definition Commands

- [ ] **3.1** Create Tauri commands: `create_field_definition`, `list_field_definitions`, `update_field_definition`, `delete_field_definition`, `reorder_field_definitions`
- [ ] **3.2** Register commands in `lib.rs`

**Validation**: Run `pnpm tauri dev` - commands accessible ✅

## 4. Entry Metadata Validation

- [ ] **4.1** Add metadata validation in `EntryService::create` against field definitions
- [ ] **4.2** Add metadata validation in `EntryService::update`
- [ ] **4.3** Implement type coercion/validation for each field type
- [ ] **4.4** Update entry tests with metadata validation scenarios

**Validation**: Run `cargo test entry` - all tests pass ✅

## 5. Frontend Field Types & API

- [ ] **5.1** Create TypeScript types: `FieldDefinition`, `FieldType`, `CreateFieldParams`
- [ ] **5.2** Create API layer: `api/field.ts` with Tauri command wrappers
- [ ] **5.3** Create Zustand store: `stores/fieldStore.ts`
- [ ] **5.4** Update `Entry` type to include parsed metadata type

**Validation**: Run `pnpm type-check` - no TypeScript errors ✅

## 6. Entry Detail Dialog

- [ ] **6.1** Create `EntryDetailDialog` component with Shadcn Dialog
- [ ] **6.2** Create `EntryHeader` component (title, dates, vault name)
- [ ] **6.3** Create `EntryDescription` component
- [ ] **6.4** Implement open/close state in `entryStore`
- [ ] **6.5** Connect `EntryRow` click to open detail dialog

**Validation**: Click entry → detail dialog opens ✅

## 7. Custom Field Display

- [ ] **7.1** Create `CustomFieldsSection` component
- [ ] **7.2** Create `CustomFieldRenderer` component (read-only display per field type)
- [ ] **7.3** Create renderers for each type: text, number, date, url, boolean, select
- [ ] **7.4** Handle empty/null field values gracefully

**Validation**: Field values display correctly in detail view ✅

## 8. Entry Edit Mode

- [ ] **8.1** Add edit mode toggle to `EntryDetailDialog`
- [ ] **8.2** Create `EditEntryForm` component with react-hook-form
- [ ] **8.3** Create `CustomFieldInput` components for each field type
- [ ] **8.4** Implement save flow: form submit → API update → store update → close edit mode
- [ ] **8.5** Add form validation with error messages
- [ ] **8.6** Update entry in list without closing dialog

**Validation**: Edit entry → save → changes appear immediately ✅

## 9. Entry Delete

- [ ] **9.1** Create `DeleteEntryDialog` confirmation component
- [ ] **9.2** Add delete button to `EntryDetailDialog`
- [ ] **9.3** Implement delete flow: confirm → API delete → store update → close dialog
- [ ] **9.4** Update entry count in vault header

**Validation**: Delete entry → removed from list immediately ✅

## 10. Field Definition Manager

- [ ] **10.1** Create `FieldDefinitionManager` component (accessible from vault settings)
- [ ] **10.2** Create `FieldDefinitionRow` component with edit/delete actions
- [ ] **10.3** Create `CreateFieldDialog` for adding new fields
- [ ] **10.4** Create `EditFieldDialog` for updating field properties
- [ ] **10.5** Implement drag-and-drop reordering (optional, can use arrows)
- [ ] **10.6** Add field manager access from vault header menu

**Validation**: Can create, edit, delete, reorder custom fields ✅

## 11. Integration & Polish

- [ ] **11.1** Test full flow: Create vault → Define fields → Create entry with metadata → Edit → Delete
- [ ] **11.2** Test edge cases: required fields, validation errors, field type changes
- [ ] **11.3** Add loading states and error handling throughout
- [ ] **11.4** Ensure smooth transitions and animations
- [ ] **11.5** Update project documentation

**Validation**: Full workflow works end-to-end ✅

---

## Dependencies

```
1.x (Database Schema) - foundation for all backend work
    ↓
2.x, 4.x (Backend Services) - can run in parallel after schema
    ↓
3.x (Tauri Commands) - requires 2.x
    ↓
5.x (Frontend Types/API) - requires 3.x
    ↓
6.x, 7.x, 8.x, 9.x, 10.x (UI Components) - mostly parallel after 5.x
    ↓
11.x (Integration) - requires all above
```

## Notes

- Tasks 2.x and 4.x can be worked on in parallel
- Tasks 6.x through 10.x can be partially parallel after 5.x
- Field Definition Manager (10.x) is lower priority than Entry Detail (6-9.x)
- Consider implementing 6-9 first, then 10.x for field management
