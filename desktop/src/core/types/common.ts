/**
 * Shared TypeScript types used across the application.
 */

/** Base entity with timestamp fields. */
export interface BaseEntity {
    id: number;
    created_at: number;
    updated_at: number;
}

/** Collection definition. */
export interface Collection extends BaseEntity {
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
}

/** Item within a collection. */
export interface Item extends BaseEntity {
    collection_id: number;
    title: string;
    properties: string; // JSON string
}

/** Attribute (custom field) definition. */
export interface Attribute {
    id: number;
    collection_id: number;
    name: string;
    key: string;
    field_type: string;
    options: string | null; // JSON string
    display_order: number | null;
    required: number | null; // 0 or 1
    searchable: number | null; // 0 or 1
    created_at: number;
}

/** Paginated response from the backend. */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

/** Field type enum (mirrors Rust FieldType). */
export type FieldType =
    | "text"
    | "textarea"
    | "number"
    | "decimal"
    | "date"
    | "datetime"
    | "select"
    | "multiselect"
    | "checkbox"
    | "url"
    | "image"
    | "file";

// ═══════════════════════════════════════════════════════════════════════
// Asset System Types (Phase 4B)
// ═══════════════════════════════════════════════════════════════════════

/** Asset source type. */
export type SourceType = "LOCAL" | "REMOTE";

/** Asset lifecycle state. */
export type AssetState =
    | "PROCESSING"
    | "READY"
    | "CACHED"
    | "ERROR"
    | "MISSING"
    | "DELETED";

/** Asset role in the context of an item. */
export type AssetRole =
    | "COVER"
    | "BACKGROUND"
    | "LOGO"
    | "BANNER"
    | "GALLERY"
    | "SCREENSHOT"
    | "ATTACHMENT";

/** Media asset record. */
export interface Asset extends BaseEntity {
    source_type: SourceType;
    source_url: string | null;
    media_type: string;
    mime_type: string;
    original_filename: string;
    relative_path: string | null;
    local_cache_path: string | null;
    thumbnail_path: string | null;
    preview_path: string | null;
    file_size_bytes: number | null;
    width: number | null;
    height: number | null;
    checksum: string | null;
    state: AssetState;
    error_message: string | null;
    metadata: string | null; // JSON string
}

/** Asset with its role context (from item_assets join). */
export interface AssetWithRole extends Asset {
    role: AssetRole;
    display_order: number | null;
    item_asset_id: number;
}

// ═══════════════════════════════════════════════════════════════════════
// CollectionSettings Types (Phase 4B)
// ═══════════════════════════════════════════════════════════════════════

/** Appearance settings for a collection. */
export interface AppearanceSettings {
    default_view_mode: "LIST" | "GRID";
    card_size: "SMALL" | "MEDIUM" | "LARGE";
    show_title_on_card: boolean;
}

/** Media settings for a collection. */
export interface MediaSettings {
    media_enabled: boolean;
    cover_enabled: boolean;
    default_cover_mode: "SYSTEM" | "CUSTOM" | "NONE";
    default_cover_asset_id: number | null;
    allowed_roles: AssetRole[];
}

/** Behavior settings for a collection. */
export interface BehaviorSettings {
    default_sort_field: string;
    default_sort_order: "ASC" | "DESC";
}

/** Parsed collection settings returned from the backend. */
export interface CollectionSettings {
    id: number;
    collection_id: number;
    appearance: AppearanceSettings;
    media: MediaSettings;
    behavior: BehaviorSettings;
    created_at: number;
    updated_at: number;
}
