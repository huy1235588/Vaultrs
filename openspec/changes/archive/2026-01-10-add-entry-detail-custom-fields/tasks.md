# Tasks: Add Entry Detail View & Custom Fields

## 1. Database Schema

- [x] **1.1** Write SQL migration for `field_definitions` table
- [x] **1.2** Generate SeaORM entity for `field_definitions`
- [x] **1.3** Add index on `field_definitions(vault_id)`

**Validation**: Run `cargo build` and verify entities compile ✅

## 2. Field Definition Backend

- [x] **2.1** Create `field` module structure: `mod.rs`, `model.rs`, `service.rs`
- [x] **2.2** Define DTOs: `FieldDefinitionDto`, `CreateFieldDto`, `UpdateFieldDto`
- [x] **2.3** Implement `FieldService` with CRUD operations:
  - `create_field(vault_id, name, field_type, options, required) -> FieldDefinition`
  - `list_fields(vault_id) -> Vec<FieldDefinition>`
  - `update_field(id, updates) -> FieldDefinition`
  - `delete_field(id) -> ()`
  - `reorder_fields(vault_id, ids[]) -> ()`
- [x] **2.4** Add field type validation (name uniqueness, valid field_type enum)
- [x] **2.5** Write unit tests for `FieldService`

**Validation**: Run `cargo test field` - all tests pass ✅

## 3. Field Definition Commands

- [x] **3.1** Create Tauri commands: `create_field_definition`, `list_field_definitions`, `update_field_definition`, `delete_field_definition`, `reorder_field_definitions`
- [x] **3.2** Register commands in `lib.rs`

**Validation**: Run `pnpm tauri dev` - commands accessible ✅

## 4. Entry Metadata Validation

- [~] **4.1** Add metadata validation in `EntryService::create` against field definitions - Deferred
- [~] **4.2** Add metadata validation in `EntryService::update` - Deferred
- [~] **4.3** Implement type coercion/validation for each field type - Deferred
- [~] **4.4** Update entry tests with metadata validation scenarios - Deferred

**Validation**: Run `cargo test entry` - all tests pass ✅

> **Note**: Backend metadata validation deferred - frontend validation implemented in `EditEntryForm.tsx` handles validation before saving. Server-side validation can be added in a follow-up if strict enforcement is required.

## 5. Frontend Field Types & API

- [x] **5.1** Create TypeScript types: `FieldDefinition`, `FieldType`, `CreateFieldParams`
- [x] **5.2** Create API layer: `api/field.ts` with Tauri command wrappers
- [x] **5.3** Create Zustand store: `stores/fieldStore.ts`
- [x] **5.4** Update `Entry` type to include parsed metadata type

**Validation**: Run `pnpm type-check` - no TypeScript errors ✅

## 6. Entry Detail Dialog

- [x] **6.1** Create `EntryDetailDialog` component with Shadcn Dialog
- [x] **6.2** Create `EntryHeader` component (title, dates, vault name) - integrated into EntryDetailDialog
- [x] **6.3** Create `EntryDescription` component - integrated into EntryDetailDialog
- [x] **6.4** Implement open/close state in `entryStore` - handled in EntryList component
- [x] **6.5** Connect `EntryRow` click to open detail dialog

**Validation**: Click entry → detail dialog opens ✅

## 7. Custom Field Display

- [x] **7.1** Create `CustomFieldsSection` component
- [x] **7.2** Create `CustomFieldRenderer` component (read-only display per field type)
- [x] **7.3** Create renderers for each type: text, number, date, url, boolean, select
- [x] **7.4** Handle empty/null field values gracefully

**Validation**: Field values display correctly in detail view ✅

## 8. Entry Edit Mode

- [x] **8.1** Add edit mode toggle to `EntryDetailDialog`
- [x] **8.2** Create `EditEntryForm` component with react-hook-form - implemented with useState for simplicity
- [x] **8.3** Create `CustomFieldInput` components for each field type
- [x] **8.4** Implement save flow: form submit → API update → store update → close edit mode
- [x] **8.5** Add form validation with error messages
- [x] **8.6** Update entry in list without closing dialog

**Validation**: Edit entry → save → changes appear immediately ✅

## 9. Entry Delete

- [x] **9.1** Create `DeleteEntryDialog` confirmation component - using AlertDialog in EntryDetailDialog
- [x] **9.2** Add delete button to `EntryDetailDialog`
- [x] **9.3** Implement delete flow: confirm → API delete → store update → close dialog
- [x] **9.4** Update entry count in vault header

**Validation**: Delete entry → removed from list immediately ✅

## 10. Field Definition Manager

- [x] **10.1** Create `FieldDefinitionManager` component (accessible from vault settings)
- [x] **10.2** Create `FieldDefinitionRow` component with edit/delete actions
- [x] **10.3** Create `CreateFieldDialog` for adding new fields
- [x] **10.4** Create `EditFieldDialog` for updating field properties
- [x] **10.5** Implement drag-and-drop reordering (optional, can use arrows) - implemented with up/down arrows
- [x] **10.6** Add field manager access from vault header menu

**Validation**: Can create, edit, delete, reorder custom fields ✅

## 11. Integration & Polish

- [x] **11.1** Test full flow: Create vault → Define fields → Create entry with metadata → Edit → Delete
- [x] **11.2** Test edge cases: required fields, validation errors, field type changes
- [x] **11.3** Add loading states and error handling throughout
- [x] **11.4** Ensure smooth transitions and animations
- [x] **11.5** Update project documentation

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
