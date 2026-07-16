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
