// Field Definition API - Type-safe Tauri command wrappers

import { invoke } from '@tauri-apps/api/core';
import type {
    FieldDefinition,
    CreateFieldParams,
    UpdateFieldParams,
    EntryPickerItem,
    RelationRef,
    ResolvedRelation,
} from './types';

export const fieldApi = {
    /**
     * Creates a new field definition for a vault.
     */
    async create(params: CreateFieldParams): Promise<FieldDefinition> {
        return invoke<FieldDefinition>('create_field_definition', {
            vaultId: params.vault_id,
            name: params.name,
            fieldType: params.field_type,
            options: params.options ?? null,
            required: params.required ?? false,
        });
    },

    /**
     * Gets a field definition by ID.
     */
    async get(id: number): Promise<FieldDefinition> {
        return invoke<FieldDefinition>('get_field_definition', { id });
    },

    /**
     * Lists all field definitions for a vault.
     */
    async list(vaultId: number): Promise<FieldDefinition[]> {
        return invoke<FieldDefinition[]>('list_field_definitions', { vaultId });
    },

    /**
     * Updates an existing field definition.
     */
    async update(id: number, params: UpdateFieldParams): Promise<FieldDefinition> {
        return invoke<FieldDefinition>('update_field_definition', {
            id,
            name: params.name ?? null,
            options: params.options ?? null,
            required: params.required ?? null,
        });
    },

    /**
     * Deletes a field definition.
     */
    async delete(id: number): Promise<void> {
        return invoke<void>('delete_field_definition', { id });
    },

    /**
     * Reorders field definitions for a vault.
     */
    async reorder(vaultId: number, ids: number[]): Promise<void> {
        return invoke<void>('reorder_field_definitions', { vaultId, ids });
    },
};

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
