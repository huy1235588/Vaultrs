// Entry API - Type-safe Tauri command wrappers

import { invoke } from '@tauri-apps/api/core';
import type { Entry, CreateEntryParams, UpdateEntryParams, PaginatedEntries, SearchResult } from '../types';

export const entryApi = {
    /**
     * Creates a new entry in a vault.
     */
    async create(params: CreateEntryParams): Promise<Entry> {
        return invoke<Entry>('create_entry', {
            vaultId: params.vault_id,
            title: params.title,
            description: params.description ?? null,
            metadata: params.metadata ?? null,
        });
    },

    /**
     * Gets an entry by ID.
     */
    async get(id: number): Promise<Entry> {
        return invoke<Entry>('get_entry', { id });
    },

    /**
     * Lists entries for a vault with pagination.
     */
    async list(vaultId: number, page: number = 0, limit: number = 100): Promise<PaginatedEntries> {
        return invoke<PaginatedEntries>('list_entries', {
            vaultId,
            page,
            limit,
        });
    },

    /**
     * Counts entries in a vault.
     */
    async count(vaultId: number): Promise<number> {
        return invoke<number>('count_entries', { vaultId });
    },

    /**
     * Updates an existing entry.
     */
    async update(id: number, params: UpdateEntryParams): Promise<Entry> {
        return invoke<Entry>('update_entry', {
            id,
            title: params.title ?? null,
            description: params.description ?? null,
            metadata: params.metadata ?? null,
        });
    },

    /**
     * Deletes an entry.
     */
    async delete(id: number): Promise<void> {
        return invoke<void>('delete_entry', { id });
    },

    /**
     * Searches entries in a vault using full-text search.
     */
    async search(vaultId: number, query: string, page: number = 0, limit: number = 100): Promise<SearchResult> {
        return invoke<SearchResult>('search_entries', {
            vaultId,
            query,
            page,
            limit,
        });
    },
};
