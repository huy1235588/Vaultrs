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

// Metadata validation result from backend
export interface MetadataValidationResult {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
}

// Parsed metadata type - maps field ID to value
export type ParsedMetadata = Record<string, string | number | boolean | null>;

/**
 * Parses metadata JSON string to an object.
 * Keys are field IDs (as strings), values are the field values.
 */
export function parseMetadata(metadata: string | null): ParsedMetadata {
    if (!metadata) return {};
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
}

/**
 * Builds metadata JSON string from an object.
 * Filters out null/undefined values.
 */
export function buildMetadataJson(values: ParsedMetadata): string {
    const filtered: ParsedMetadata = {};
    for (const [key, value] of Object.entries(values)) {
        if (value !== null && value !== undefined) {
            filtered[key] = value;
        }
    }
    return JSON.stringify(filtered);
}
