// Entry types matching Rust models

export interface Entry {
    id: number;
    vault_id: number;
    title: string;
    description: string | null;
    metadata: string | null;
    cover_image_path: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateEntryParams {
    vault_id: number;
    title: string;
    description?: string | null;
    metadata?: string | null;
}

export interface UpdateEntryParams {
    title?: string | null;
    description?: string | null;
    metadata?: string | null;
}

export interface PaginatedEntries {
    entries: Entry[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

export interface SearchResult {
    entries: Entry[];
    total: number;
    query: string;
    page: number;
    limit: number;
    has_more: boolean;
}
