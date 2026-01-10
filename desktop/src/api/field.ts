// Field Definition API - Type-safe Tauri command wrappers

import { invoke } from '@tauri-apps/api/core';
import type {
    FieldDefinition,
    CreateFieldParams,
    UpdateFieldParams,
} from '../types';

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
