# Technical Design: Cross-Vault Reference

## 1. Overview

Tài liệu này mô tả chi tiết giải pháp kỹ thuật cho tính năng **Cross-Vault Reference** - cho phép liên kết Entry giữa các Vault khác nhau.

---

## 2. Data Model

### 2.1 Field Type Extension

Thêm variant `Relation` vào enum `FieldType`:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FieldType {
    Text,
    Number,
    Date,
    Url,
    Boolean,
    Select,
    Relation,  // NEW
}
```

### 2.2 FieldOptions Extension

Mở rộng `FieldOptions` để hỗ trợ cấu hình Relation:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FieldOptions {
    // Existing fields...
    pub max_length: Option<i32>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub choices: Option<Vec<String>>,

    // NEW: Relation-specific options
    /// Target vault ID for relation field
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_vault_id: Option<i32>,

    /// Display fields from target entry (optional, default: ["title"])
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_fields: Option<Vec<String>>,
}
```

### 2.3 Metadata Storage Format

Relation field lưu trong metadata theo format:

```json
{
  "field_id": {
    "entry_id": 123,
    "vault_id": 5
  }
}
```

**Ví dụ hoàn chỉnh:**

```json
{
  "1": "Inception",
  "2": 2010,
  "3": {
    "entry_id": 42,
    "vault_id": 5
  }
}
```

**Rationale:**

-   Lưu cả `vault_id` để verify integrity (phòng trường hợp target vault config thay đổi)
-   Không lưu title/name vì dễ out-of-sync khi target entry được update
-   Resolve động khi cần hiển thị

### 2.4 TypeScript Types

```typescript
// Relation value stored in metadata
interface RelationValue {
    entry_id: number;
    vault_id: number;
}

// Extended FieldOptions
interface FieldOptions {
    // Existing...
    maxLength?: number;
    min?: number;
    max?: number;
    choices?: string[];

    // Relation-specific
    targetVaultId?: number;
    displayFields?: string[];
}

// Resolved relation for display
interface ResolvedRelation {
    entryId: number;
    vaultId: number;
    title: string;
    exists: boolean;
    // Optional additional fields based on displayFields config
    displayData?: Record<string, unknown>;
}
```

---

## 3. Database Schema

### 3.1 Không cần schema changes

-   `field_definitions.field_type` đã là `TEXT` → có thể lưu "relation"
-   `field_definitions.options` đã là `TEXT` (JSON) → có thể lưu `target_vault_id`
-   `entries.metadata` đã là `TEXT` (JSON) → có thể lưu relation object

### 3.2 Example Data

**Field Definition:**

```sql
INSERT INTO field_definitions (vault_id, name, field_type, options, position, required)
VALUES (
    1,                                          -- Movies vault
    'Director',
    'relation',
    '{"targetVaultId": 5}',                     -- Directors vault
    1,
    0
);
```

**Entry with Relation:**

```sql
INSERT INTO entries (vault_id, title, metadata)
VALUES (
    1,
    'Inception',
    '{"3": {"entry_id": 42, "vault_id": 5}}'   -- Field 3 references Entry 42 in Vault 5
);
```

---

## 4. Backend API Design

### 4.1 New Endpoints

#### 4.1.1 Search Entries for Relation Picker

```rust
/// Search entries in a target vault for relation picker
/// 
/// # Arguments
/// * `vault_id` - Target vault to search in
/// * `query` - Search query string
/// * `limit` - Max results (default: 20)
/// 
/// # Returns
/// List of entry summaries for picker display
#[tauri::command]
pub async fn search_entries_for_relation(
    db: State<'_, DatabaseConnection>,
    vault_id: i32,
    query: String,
    limit: Option<i32>,
) -> Result<Vec<EntryPickerItem>, AppError>
```

**Response DTO:**

```rust
#[derive(Debug, Serialize)]
pub struct EntryPickerItem {
    pub id: i32,
    pub vault_id: i32,
    pub title: String,
    pub subtitle: Option<String>,  // Optional secondary info
    pub thumbnail: Option<String>, // Cover image if exists
}
```

#### 4.1.2 Resolve Relations (Batch)

```rust
/// Resolve multiple relations in batch
/// 
/// # Arguments
/// * `relations` - List of (entry_id, vault_id) pairs to resolve
/// 
/// # Returns
/// Map of "entry_id:vault_id" -> ResolvedRelation
#[tauri::command]
pub async fn resolve_relations(
    db: State<'_, DatabaseConnection>,
    relations: Vec<RelationRef>,
) -> Result<HashMap<String, ResolvedRelation>, AppError>
```

**DTOs:**

```rust
#[derive(Debug, Deserialize)]
pub struct RelationRef {
    pub entry_id: i32,
    pub vault_id: i32,
}

#[derive(Debug, Serialize)]
pub struct ResolvedRelation {
    pub entry_id: i32,
    pub vault_id: i32,
    pub title: String,
    pub exists: bool,
    pub vault_name: Option<String>,
    pub cover_image_path: Option<String>,
}
```

### 4.2 Modified Endpoints

#### 4.2.1 Get Entry with Relations

Extend existing `get_entry` to optionally resolve relations:

```rust
#[tauri::command]
pub async fn get_entry(
    db: State<'_, DatabaseConnection>,
    id: i32,
    resolve_relations: Option<bool>,  // NEW: default false
) -> Result<EntryWithRelations, AppError>
```

**Response with resolved relations:**

```rust
#[derive(Debug, Serialize)]
pub struct EntryWithRelations {
    #[serde(flatten)]
    pub entry: EntryDto,
    
    /// Resolved relation data (only if resolve_relations=true)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_relations: Option<HashMap<String, ResolvedRelation>>,
}
```

### 4.3 Validation

```rust
impl FieldService {
    /// Validate relation field configuration
    pub async fn validate_relation_options(
        db: &DatabaseConnection,
        options: &FieldOptions,
    ) -> Result<(), AppError> {
        if let Some(target_vault_id) = options.target_vault_id {
            // Check target vault exists
            let vault = VaultService::get_by_id(db, target_vault_id).await?;
            if vault.is_none() {
                return Err(AppError::ValidationError(
                    format!("Target vault {} does not exist", target_vault_id)
                ));
            }
        }
        Ok(())
    }
}
```

---

## 5. Data Integrity Handling

### 5.1 Strategy: Soft Reference with Runtime Check

**Approach:** Không sử dụng FK constraints, thay vào đó kiểm tra tồn tại khi resolve.

**Rationale:**

1. FK không thể enforce qua JSON metadata
2. Cho phép graceful degradation khi target entry bị xóa
3. Đơn giản hóa delete operations
4. Phù hợp với "lazy cleanup" strategy đã có

### 5.2 Scenarios và Handling

#### Scenario A: Target Entry bị xóa

```
State:
- Entry A (Movies/Inception) có relation field pointing to Entry B (Directors/Nolan)
- Entry B bị xóa

Handling:
1. Entry A vẫn giữ nguyên metadata: {"3": {"entry_id": 42, "vault_id": 5}}
2. Khi resolve, phát hiện Entry 42 không tồn tại
3. Trả về: { exists: false, title: "[Deleted]" }
4. UI hiển thị "[Deleted Entry]" với style khác biệt (mờ, strikethrough)
5. Không tự động xóa reference (giữ nguyên để user có thể thấy và xử lý)
```

**Implementation:**

```rust
pub async fn resolve_single_relation(
    db: &DatabaseConnection,
    entry_id: i32,
    vault_id: i32,
) -> ResolvedRelation {
    match EntryService::get_by_id(db, entry_id).await {
        Ok(Some(entry)) if entry.vault_id == vault_id => {
            ResolvedRelation {
                entry_id,
                vault_id,
                title: entry.title,
                exists: true,
                vault_name: Some(entry.vault_name),
                cover_image_path: entry.cover_image_path,
            }
        }
        _ => {
            ResolvedRelation {
                entry_id,
                vault_id,
                title: "[Deleted]".to_string(),
                exists: false,
                vault_name: None,
                cover_image_path: None,
            }
        }
    }
}
```

#### Scenario B: Target Vault bị xóa

```
State:
- Entry A có relation field với target_vault_id = 5
- Vault 5 bị xóa (cascade delete tất cả entries)

Handling:
1. Field definition vẫn còn (chỉ config thay đổi)
2. Tất cả entries có relation đến vault 5 trở thành dangling
3. Khi resolve, trả về exists: false cho tất cả
4. Admin nên xóa hoặc reconfigure field definition
```

**Pre-delete Warning (UI):**

```typescript
async function handleDeleteVault(vaultId: number) {
    // Check if any field references this vault
    const referencingFields = await getFieldsReferencingVault(vaultId);

    if (referencingFields.length > 0) {
        const confirmed = await confirm(
            `Warning: ${referencingFields.length} relation field(s) reference this vault. ` +
                "Deleting will make those relations invalid. Continue?"
        );
        if (!confirmed) return;
    }

    await deleteVault(vaultId);
}
```

#### Scenario C: Field với target_vault_id không còn valid

```
Handling:
1. Khi load field definitions, validate target_vault_id
2. Nếu target vault không tồn tại:
   - Field vẫn hiển thị nhưng với warning badge
   - Disable việc thêm/edit relation value
   - Admin có thể update target_vault_id hoặc xóa field
```

### 5.3 Cleanup Strategy

**On Entry Update (Lazy Cleanup):**

Khi entry được update, filter ra relation values không còn valid:

```rust
pub fn clean_relation_metadata(
    metadata: &mut serde_json::Value,
    field_definitions: &[FieldDefinition],
    db: &DatabaseConnection,
) -> Result<(), AppError> {
    let valid_field_ids: HashSet<_> = field_definitions.iter().map(|f| f.id).collect();
    
    if let Some(obj) = metadata.as_object_mut() {
        // Remove orphan keys (field no longer exists)
        obj.retain(|key, _| {
            key.parse::<i32>()
                .map(|id| valid_field_ids.contains(&id))
                .unwrap_or(false)
        });
        
        // For relation fields, optionally validate target still exists
        // (or leave dangling for explicit user cleanup)
    }
    
    Ok(())
}
```

---

## 6. Frontend Components

### 6.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Entry Detail View                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  RelationFieldDisplay                                 │  │
│  │  ┌─────────┬──────────────────────────────────────┐   │  │
│  │  │ [Avatar]│  Christopher Nolan                   │→  │  │
│  │  │         │  Directors                           │   │  │
│  │  └─────────┴──────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Entry Edit Form                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Director:                                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  RelationFieldEditor                                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ 🔍 Search directors...                     [×]  │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │ [img] Christopher Nolan                         │  │  │
│  │  │ [img] Steven Spielberg                          │  │  │
│  │  │ [img] Denis Villeneuve                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 RelationFieldEditor

```typescript
interface RelationFieldEditorProps {
    fieldId: number;
    targetVaultId: number;
    value: RelationValue | null;
    onChange: (value: RelationValue | null) => void;
    disabled?: boolean;
}

function RelationFieldEditor({
    fieldId,
    targetVaultId,
    value,
    onChange,
    disabled,
}: RelationFieldEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<EntryPickerItem[]>([]);

    // Debounced search
    const debouncedSearch = useDebouncedCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        const items = await invoke("search_entries_for_relation", {
            vaultId: targetVaultId,
            query: q,
            limit: 20,
        });
        setResults(items);
    }, 300);

    const handleSelect = (item: EntryPickerItem) => {
        onChange({
            entry_id: item.id,
            vault_id: item.vault_id,
        });
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange(null);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={disabled}
                >
                    {value ? (
                        <SelectedRelationDisplay value={value} />
                    ) : (
                        <span className="text-muted-foreground">
                            Select entry...
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <Command>
                    <CommandInput
                        placeholder="Search..."
                        value={query}
                        onValueChange={(q) => {
                            setQuery(q);
                            debouncedSearch(q);
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {results.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <EntryPickerItemDisplay item={item} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-2"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </Popover>
    );
}
```

### 6.3 RelationFieldDisplay

```typescript
interface RelationFieldDisplayProps {
    value: RelationValue;
    resolvedData?: ResolvedRelation;
    onClick?: () => void;
}

function RelationFieldDisplay({
    value,
    resolvedData,
    onClick,
}: RelationFieldDisplayProps) {
    // If not resolved yet, show loading
    if (!resolvedData) {
        return <Skeleton className="h-8 w-48" />;
    }

    // If entry was deleted
    if (!resolvedData.exists) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="line-through">[Deleted Entry]</span>
            </div>
        );
    }

    // Normal display with hyperlink
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left w-full"
        >
            {resolvedData.cover_image_path ? (
                <img
                    src={resolvedData.cover_image_path}
                    alt=""
                    className="w-10 h-10 rounded object-cover"
                />
            ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{resolvedData.title}</div>
                {resolvedData.vault_name && (
                    <div className="text-sm text-muted-foreground">
                        {resolvedData.vault_name}
                    </div>
                )}
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </button>
    );
}
```

### 6.4 Navigation Hook

```typescript
function useRelationNavigation() {
    const navigate = useNavigate();

    const navigateToEntry = useCallback(
        (entryId: number, vaultId: number) => {
            navigate(`/vault/${vaultId}/entry/${entryId}`);
        },
        [navigate]
    );

    return { navigateToEntry };
}
```

---

## 7. Performance Considerations

### 7.1 Lazy Loading Relations

**Default behavior:** Relations are NOT resolved automatically when listing entries.

```rust
// List entries - relations NOT resolved (fast)
let entries = EntryService::list(db, vault_id, pagination).await?;

// Single entry detail - optionally resolve relations
let entry = EntryService::get_with_relations(db, entry_id, true).await?;
```

### 7.2 Batch Resolution

Khi cần resolve nhiều relations (e.g., trong table view):

```typescript
// Frontend batches relation resolution
const relationsToResolve = entries
    .flatMap((e) => extractRelationValues(e.metadata))
    .filter(unique);

const resolved = await invoke("resolve_relations", {
    relations: relationsToResolve,
});

// Merge resolved data back to entries
const enrichedEntries = entries.map((e) => ({
    ...e,
    resolvedRelations: mapRelationsToEntry(e, resolved),
}));
```

### 7.3 Caching Strategy

```typescript
// Use React Query with stale-while-revalidate
const { data: resolvedRelation } = useQuery({
    queryKey: ["relation", entryId, vaultId],
    queryFn: () => resolveRelation(entryId, vaultId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

---

## 8. Migration Path

### 8.1 Database Migration

Không cần migration vì schema đã đủ linh hoạt.

### 8.2 Code Changes Checklist

**Backend:**

-   [ ] Add `Relation` to `FieldType` enum
-   [ ] Extend `FieldOptions` with `target_vault_id`
-   [ ] Add `search_entries_for_relation` command
-   [ ] Add `resolve_relations` command
-   [ ] Update `get_entry` to support relation resolution
-   [ ] Add validation for relation field options

**Frontend:**

-   [ ] Add `RelationFieldEditor` component
-   [ ] Add `RelationFieldDisplay` component
-   [ ] Update field type mapping in form renderer
-   [ ] Add navigation hook for relation links
-   [ ] Update entry detail view to handle relations

---

## 9. Testing Strategy

### 9.1 Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_resolve_existing_relation() {
        // Create vault B with entry
        // Resolve relation -> should return entry data
    }

    #[test]
    fn test_resolve_deleted_relation() {
        // Create vault B with entry, delete entry
        // Resolve relation -> should return exists: false
    }

    #[test]
    fn test_validate_relation_options() {
        // Invalid target_vault_id -> should error
        // Valid target_vault_id -> should pass
    }
}
```

### 9.2 Integration Tests

-   Create field with relation type
-   Create entry with relation value
-   Query entry and verify relation resolved
-   Delete target entry and verify graceful handling
-   Test relation picker search functionality

---

## 10. Summary

### Key Design Decisions

| Decision                       | Rationale                                              |
| ------------------------------ | ------------------------------------------------------ |
| Soft reference (no FK)         | Flexibility, graceful degradation, fits JSON metadata  |
| Store entry_id + vault_id      | Data integrity verification, explicit reference        |
| Lazy relation resolution       | Performance - don't resolve unless needed              |
| Batch resolution API           | Efficient for list views with multiple relations       |
| "[Deleted]" for missing refs   | Clear UX, no data loss, user can decide action         |
| No bidirectional links         | Simplicity first, can extend later                     |
| Single reference only          | MVP scope, multi-select can be future enhancement      |

### Trade-offs

| Trade-off                | Pro                           | Con                                    |
| ------------------------ | ----------------------------- | -------------------------------------- |
| Soft vs Hard FK          | Flexible, graceful            | No automatic cascade, manual cleanup   |
| Lazy vs Eager resolution | Performance                   | Extra API calls for detail view        |
| ID-based vs Name-based   | Stable reference              | Need resolution for display            |

---

_Last Updated: 2026-02-01_
