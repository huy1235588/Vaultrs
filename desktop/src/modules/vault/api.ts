// Vault API - Type-safe Tauri command wrappers

import { invoke } from '@tauri-apps/api/core';
import type { Vault, CreateVaultParams, UpdateVaultParams } from './types';

export const vaultApi = {
    /**
     * Creates a new vault.
     */
    async create(params: CreateVaultParams): Promise<Vault> {
        return invoke<Vault>('create_vault', {
            name: params.name,
            description: params.description ?? null,
            icon: params.icon ?? null,
            color: params.color ?? null,
        });
    },

    /**
     * Gets a vault by ID.
     */
    async get(id: number): Promise<Vault> {
        return invoke<Vault>('get_vault', { id });
    },

    /**
     * Lists all vaults.
     */
    async list(): Promise<Vault[]> {
        return invoke<Vault[]>('list_vaults');
    },

    /**
     * Updates an existing vault.
     */
    async update(id: number, params: UpdateVaultParams): Promise<Vault> {
        return invoke<Vault>('update_vault', {
            id,
            name: params.name ?? null,
            description: params.description ?? null,
            icon: params.icon ?? null,
            color: params.color ?? null,
        });
    },

    /**
     * Deletes a vault.
     */
    async delete(id: number): Promise<void> {
        return invoke<void>('delete_vault', { id });
    },
};
