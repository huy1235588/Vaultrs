// Field definition store using Zustand

import { create } from 'zustand';
import type { FieldDefinition, CreateFieldParams, UpdateFieldParams } from '../types';
import { fieldApi } from '../api';

interface FieldState {
    // State
    fields: FieldDefinition[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchFields: (vaultId: number) => Promise<void>;
    createField: (params: CreateFieldParams) => Promise<FieldDefinition>;
    updateField: (id: number, params: UpdateFieldParams) => Promise<FieldDefinition>;
    deleteField: (id: number) => Promise<void>;
    reorderFields: (vaultId: number, ids: number[]) => Promise<void>;
    resetFields: () => void;
    clearError: () => void;
}

export const useFieldStore = create<FieldState>((set) => ({
    // Initial state
    fields: [],
    isLoading: false,
    error: null,

    // Actions
    fetchFields: async (vaultId) => {
        set({ isLoading: true, error: null });

        try {
            const fields = await fieldApi.list(vaultId);
            set({ fields, isLoading: false });
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    createField: async (params) => {
        set({ error: null });
        try {
            const field = await fieldApi.create(params);
            set((state) => ({
                fields: [...state.fields, field].sort((a, b) => a.position - b.position),
            }));
            return field;
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    updateField: async (id, params) => {
        set({ error: null });
        try {
            const updated = await fieldApi.update(id, params);
            set((state) => ({
                fields: state.fields.map((f) => (f.id === id ? updated : f)),
            }));
            return updated;
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    deleteField: async (id) => {
        set({ error: null });
        try {
            await fieldApi.delete(id);
            set((state) => ({
                fields: state.fields.filter((f) => f.id !== id),
            }));
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    reorderFields: async (vaultId, ids) => {
        set({ error: null });
        try {
            await fieldApi.reorder(vaultId, ids);
            // Update local positions based on new order
            set((state) => ({
                fields: ids.map((id, index) => {
                    const field = state.fields.find((f) => f.id === id);
                    return field ? { ...field, position: index } : null;
                }).filter((f): f is FieldDefinition => f !== null),
            }));
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    resetFields: () => {
        set({
            fields: [],
            isLoading: false,
            error: null,
        });
    },

    clearError: () => {
        set({ error: null });
    },
}));
