# Change: Add Entry Detail View & Custom Fields

## Why

Currently, entries only display in a list with basic information (title, description, date). Users cannot:
1. View full entry details in an expanded view  
2. Edit or delete entries directly from the UI
3. Add custom fields specific to their vault type (e.g., "Director" for movies, "Author" for books)

This change adds a **detail panel/dialog** for viewing and editing entries, plus a **dynamic schema system** using JSON columns for vault-specific custom fields without requiring database migrations.

## What Changes

### Backend (Rust)

- **Custom Field Definitions**: New `field_definitions` table to store per-vault field schemas
- **Field Definition API**: CRUD for managing custom field definitions per vault
- **Entry Metadata**: Parse/validate `metadata` JSON column against field definitions
- **Enhanced Entry Service**: Support structured metadata in entry CRUD operations

### Frontend (React)

- **EntryDetailDialog**: Full-width dialog/panel for viewing entry details
- **EditEntryForm**: Form component for editing entry with validation
- **CustomFieldRenderer**: Dynamic field rendering based on field type (text, number, date, url, etc.)
- **CustomFieldEditor**: Inline field editing components
- **FieldDefinitionManager**: UI for vault owners to define custom fields
- **Delete Confirmation**: Confirmation dialog before deleting entries

## Impact

- **Affected specs**:
  - `entry-management` (MODIFIED) - Add detail view, edit, delete operations
  - `custom-fields` (NEW) - Dynamic schema for vault-specific fields

- **Affected code**:
  - `src-tauri/src/field/` - New module for field definitions
  - `src-tauri/src/entry/` - Enhanced metadata handling
  - `src/components/entry/` - New detail, edit, and delete components
  - `src/components/field/` - New field rendering components

## Success Criteria

1. User can click on an entry to open a detail view dialog
2. User can edit entry title, description, and metadata from detail view
3. User can delete an entry with confirmation
4. User can define custom fields for a vault (text, number, date, url, boolean, select)
5. Custom field values are validated on save
6. Field definitions persist across sessions
7. Entry list updates immediately after edit/delete
