// Vault store using Zustand

import { create } from 'zustand';
import type { Vault, CreateVaultParams, UpdateVaultParams } from '../types';
import { vaultApi } from '../api';

interface VaultState {
    // State
    vaults: Vault[];
    activeVaultId: number | null;
    isLoading: boolean;
    error: string | null;

    // Computed
    activeVault: Vault | null;

    // Actions
    fetchVaults: () => Promise<void>;
    createVault: (params: CreateVaultParams) => Promise<Vault>;
    updateVault: (id: number, params: UpdateVaultParams) => Promise<Vault>;
    deleteVault: (id: number) => Promise<void>;
    setActiveVault: (id: number | null) => void;
    clearError: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
    // Initial state
    vaults: [],
    activeVaultId: null,
    isLoading: false,
    error: null,

    // Computed getter
    get activeVault() {
        const { vaults, activeVaultId } = get();
        return vaults.find((v) => v.id === activeVaultId) ?? null;
    },

    // Actions
    fetchVaults: async () => {
        set({ isLoading: true, error: null });
        try {
            const vaults = await vaultApi.list();
            set({ vaults, isLoading: false });
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    createVault: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const vault = await vaultApi.create(params);
            set((state) => ({
                vaults: [vault, ...state.vaults],
                activeVaultId: vault.id,
                isLoading: false,
            }));
            return vault;
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    updateVault: async (id, params) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await vaultApi.update(id, params);
            set((state) => ({
                vaults: state.vaults.map((v) => (v.id === id ? updated : v)),
                isLoading: false,
            }));
            return updated;
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    deleteVault: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await vaultApi.delete(id);
            set((state) => {
                const vaults = state.vaults.filter((v) => v.id !== id);
                const activeVaultId =
                    state.activeVaultId === id ? (vaults[0]?.id ?? null) : state.activeVaultId;
                return { vaults, activeVaultId, isLoading: false };
            });
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    setActiveVault: (id) => {
        set({ activeVaultId: id });
    },

    clearError: () => {
        set({ error: null });
    },
}));
