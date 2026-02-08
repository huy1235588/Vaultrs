// Relation API - Type-safe Tauri command wrappers for cross-vault references

import { invoke } from '@tauri-apps/api/core';
import type {
    EntryPickerItem,
    RelationRef,
    ResolvedRelation,
} from './types';

/**
 * Relation API - Functions for cross-vault references
 */
export const relationApi = {
    /**
     * Searches entries in a vault for the relation picker.
     */
    async searchEntriesForPicker(
        vaultId: number,
        query: string,
        limit?: number
    ): Promise<EntryPickerItem[]> {
        return invoke<EntryPickerItem[]>('search_entries_for_relation', {
            vaultId,
            query,
            limit: limit ?? 20,
        });
    },

    /**
     * Resolves multiple relation references in batch.
     * Returns a map where keys are "entry_id:vault_id" strings.
     */
    async resolveRelations(
        relations: RelationRef[]
    ): Promise<Record<string, ResolvedRelation>> {
        return invoke<Record<string, ResolvedRelation>>('resolve_relations', {
            relations,
        });
    },

    /**
     * Creates a key for looking up resolved relations.
     */
    createRelationKey(entryId: number, vaultId: number): string {
        return `${entryId}:${vaultId}`;
    },
};
