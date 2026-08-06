/**
 * Search API service — Tauri IPC wrappers for search commands.
 */
import { tauriInvoke } from "./tauri";
import type { Item } from "@/core/types/common";

// --- Types ---

/** Search query parameters. */
export interface SearchParams {
    query: string;
    collection_id?: number;
    limit?: number;
    offset?: number;
}

/** Search result — Item with FTS5 relevance rank. */
export interface SearchResult {
    id: number;
    collection_id: number;
    title: string;
    created_at: number;
    updated_at: number;
    properties: string;
    /** FTS5 rank score (lower = more relevant). */
    rank: number;
}

/** Paginated search response. */
export interface SearchResponse {
    data: SearchResult[];
    total: number;
    limit: number;
    offset: number;
}

// --- API Calls ---

/** Full-text search across items. */
export async function searchItems(
    params: SearchParams,
): Promise<SearchResponse> {
    return tauriInvoke<SearchResponse>("search_items", { params });
}

/** Quick search for autocomplete/typeahead. */
export async function quickSearch(
    query: string,
    collectionId?: number,
    limit?: number,
): Promise<SearchResult[]> {
    return tauriInvoke<SearchResult[]>("quick_search", {
        query,
        collectionId,
        limit,
    });
}
