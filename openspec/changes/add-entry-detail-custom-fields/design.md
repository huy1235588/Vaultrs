# Design: Entry Detail View & Custom Fields

## Context

Vaultrs needs a flexible schema system to support different types of collections (movies, books, photos, etc.) without requiring database migrations for each new field type. The current `metadata` column (JSON text) provides a foundation, but lacks structure and validation.

### Stakeholders
- **Users**: Need to view, edit, and organize entries with custom fields
- **System**: Must validate data integrity and maintain query performance

### Constraints
- SQLite JSON1 extension available for JSON queries
- Single-user desktop app (no concurrent write conflicts)
- Must scale to 10M+ entries with pagination

## Goals / Non-Goals

### Goals
- Enable viewing and editing entry details in a modal/panel
- Allow per-vault custom field definitions
- Support common field types (text, number, date, url, boolean, select)
- Validate field values on entry save
- Maintain fast list scrolling performance

### Non-Goals
- Complex field types (file upload, rich text, relations)
- Field-level search/filtering (future feature)
- Field-level permissions
- Import/export field definitions

## Decisions

### 1. Custom Fields Storage Strategy

**Decision**: Use **JSON column with schema registry** approach.

**Approach**:
```
field_definitions table:
  - id, vault_id, name, field_type, options (JSON), position, required, created_at

entries.metadata column:
  - JSON object: { "director": "Nolan", "year": 2010, "imdb_url": "..." }
```

**Alternatives Considered**:

| Approach | Pros | Cons |
|----------|------|------|
| **EAV (Entity-Attribute-Value)** | Fully normalized, easy queries per field | Complex joins, poor performance at scale |
| **JSON column only** | Simple, flexible, fast writes | No schema validation, hard to query |
| **JSON + Schema Registry** ✅ | Validated, flexible, good performance | Slightly more complex |
| **Separate tables per vault** | Perfect normalization | Migration nightmare, hard to scale |

**Rationale**: JSON + Schema Registry balances flexibility with data integrity. SQLite's JSON1 extension allows querying JSON fields when needed (future search feature).

### 2. Field Type System

**Decision**: Start with 6 core field types:

| Type | Description | Storage | Validation |
|------|-------------|---------|------------|
| `text` | Free-form text | String | Max length |
| `number` | Integer or decimal | Number | Min/max, precision |
| `date` | Date without time | ISO 8601 string | Valid date format |
| `url` | Web URL | String | Valid URL pattern |
| `boolean` | Yes/No toggle | Boolean | - |
| `select` | Dropdown choices | String | Must be in options |

**Options Schema** (stored in `options` JSON column):
```json
{
  "maxLength": 500,      // text
  "min": 0, "max": 100,  // number
  "choices": ["Option A", "Option B"]  // select
}
```

### 3. UI Component Architecture

**Decision**: Use **Dialog-based detail view** with inline editing.

```
EntryDetailDialog
├── EntryHeader (title, dates, actions)
├── EntryDescription (markdown-like display)
├── CustomFieldsSection
│   └── CustomFieldRenderer (per field)
├── EntryActions (Edit, Delete buttons)
└── EditMode Toggle
    └── EditEntryForm
        └── CustomFieldInput (per field type)
```

**Rationale**:
- Dialog overlays list, preserving scroll position
- Inline editing reduces navigation
- Shadcn Dialog provides accessibility out of the box

### 4. Entry Deletion Flow

**Decision**: **Soft confirmation** via AlertDialog.

Flow:
1. User clicks delete button (trash icon)
2. AlertDialog appears: "Delete entry? This cannot be undone."
3. Confirm → Delete API → Update store → Close dialog

No undo/trash feature for MVP (keep it simple).

## Data Model

### Field Definitions Table

```sql
CREATE TABLE field_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_id INTEGER NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'url', 'boolean', 'select')),
    options TEXT, -- JSON for type-specific config
    position INTEGER NOT NULL DEFAULT 0,
    required INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(vault_id, name)
);

CREATE INDEX idx_field_definitions_vault ON field_definitions(vault_id);
```

### Entry Metadata Structure

```typescript
interface EntryMetadata {
  [fieldName: string]: string | number | boolean | null;
}

// Example for Movies vault:
{
  "director": "Christopher Nolan",
  "year": 2010,
  "imdb_url": "https://imdb.com/title/tt1375666",
  "watched": true,
  "genre": "Sci-Fi"
}
```

## API Design

### Backend Commands (Tauri IPC)

```rust
// Field Definition CRUD
create_field_definition(vault_id, name, field_type, options, required) -> FieldDefinition
get_field_definitions(vault_id) -> Vec<FieldDefinition>
update_field_definition(id, updates) -> FieldDefinition
delete_field_definition(id) -> ()
reorder_field_definitions(vault_id, ids[]) -> ()

// Enhanced Entry (existing, modified)
create_entry(..., metadata: serde_json::Value) -> Entry
update_entry(..., metadata: serde_json::Value) -> Entry
```

### Frontend API Layer

```typescript
// api/field.ts
fieldApi.create(params: CreateFieldParams): Promise<FieldDefinition>
fieldApi.list(vaultId: number): Promise<FieldDefinition[]>
fieldApi.update(id: number, params: UpdateFieldParams): Promise<FieldDefinition>
fieldApi.delete(id: number): Promise<void>
fieldApi.reorder(vaultId: number, ids: number[]): Promise<void>
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| JSON validation overhead | Validate only on save, not on list render |
| Large metadata slowing list | Only fetch metadata in detail view, not list |
| Field definition changes break old entries | Validate loosely - unknown fields ignored, missing fields = null |
| Complex field types requested | Document as non-goal, plan for future extension |

## Migration Plan

1. Add `field_definitions` table via migration
2. Existing entries continue working (metadata stays as-is)
3. No data migration needed - backward compatible

## Open Questions

- [ ] Should field definitions be copyable between vaults?
- [ ] Maximum number of custom fields per vault? (suggest 50)
- [ ] Should we support field groups/sections? (defer to future)
