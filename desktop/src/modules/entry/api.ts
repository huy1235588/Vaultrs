// Entry API - Type-safe Tauri command wrappers

import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import type { Entry, CreateEntryParams, UpdateEntryParams, PaginatedEntries, SearchResult } from './types';

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
     * Deletes an entry and its cover image.
     */
    async delete(id: number): Promise<void> {
        const appDataDirPath = await appDataDir();
        return invoke<void>('delete_entry', { id, appDataDir: appDataDirPath });
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

    /**
     * Uploads a cover image for an entry from a local file.
     */
    async uploadCoverImage(entryId: number, filePath: string): Promise<Entry> {
        const appDataDirPath = await appDataDir();
        return invoke<Entry>('upload_entry_cover_image', {
            entryId,
            filePath,
            appDataDir: appDataDirPath,
        });
    },

    /**
     * Sets a cover image for an entry from a URL.
     */
    async setCoverUrl(entryId: number, url: string): Promise<Entry> {
        const appDataDirPath = await appDataDir();
        return invoke<Entry>('set_entry_cover_url', {
            entryId,
            url,
            appDataDir: appDataDirPath,
        });
    },

    /**
     * Gets the thumbnail for an entry's cover image as a base64 data URL.
     */
    async getThumbnail(entryId: number): Promise<string> {
        const appDataDirPath = await appDataDir();
        return invoke<string>('get_entry_thumbnail', {
            entryId,
            appDataDir: appDataDirPath,
        });
    },

    /**
     * Removes the cover image from an entry.
     */
    async removeCover(entryId: number): Promise<Entry> {
        const appDataDirPath = await appDataDir();
        return invoke<Entry>('remove_entry_cover', {
            entryId,
            appDataDir: appDataDirPath,
        });
    },
};
