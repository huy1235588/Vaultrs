// Entry store using Zustand

import { create } from 'zustand';
import type { Entry, CreateEntryParams, UpdateEntryParams } from '../types';
import { entryApi } from '../api';

interface EntryState {
    // State
    entries: Entry[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;

    // Actions
    fetchEntries: (vaultId: number, reset?: boolean) => Promise<void>;
    loadMoreEntries: (vaultId: number) => Promise<void>;
    createEntry: (params: CreateEntryParams) => Promise<Entry>;
    updateEntry: (id: number, params: UpdateEntryParams) => Promise<Entry>;
    deleteEntry: (id: number) => Promise<void>;
    resetEntries: () => void;
    clearError: () => void;
}

const DEFAULT_LIMIT = 100;

export const useEntryStore = create<EntryState>((set, get) => ({
    // Initial state
    entries: [],
    total: 0,
    page: 0,
    limit: DEFAULT_LIMIT,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,

    // Actions
    fetchEntries: async (vaultId, reset = true) => {
        if (reset) {
            set({ isLoading: true, error: null, entries: [], page: 0 });
        }

        try {
            const result = await entryApi.list(vaultId, 0, DEFAULT_LIMIT);
            set({
                entries: result.entries,
                total: result.total,
                page: 0,
                hasMore: result.has_more,
                isLoading: false,
            });
        } catch (err) {
            set({ error: String(err), isLoading: false });
            throw err;
        }
    },

    loadMoreEntries: async (vaultId) => {
        const { page, hasMore, isLoadingMore } = get();

        if (!hasMore || isLoadingMore) return;

        set({ isLoadingMore: true, error: null });

        try {
            const nextPage = page + 1;
            const result = await entryApi.list(vaultId, nextPage, DEFAULT_LIMIT);
            set((state) => ({
                entries: [...state.entries, ...result.entries],
                total: result.total,
                page: nextPage,
                hasMore: result.has_more,
                isLoadingMore: false,
            }));
        } catch (err) {
            set({ error: String(err), isLoadingMore: false });
            throw err;
        }
    },

    createEntry: async (params) => {
        set({ error: null });
        try {
            const entry = await entryApi.create(params);
            set((state) => ({
                entries: [entry, ...state.entries],
                total: state.total + 1,
            }));
            return entry;
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    updateEntry: async (id, params) => {
        set({ error: null });
        try {
            const updated = await entryApi.update(id, params);
            set((state) => ({
                entries: state.entries.map((e) => (e.id === id ? updated : e)),
            }));
            return updated;
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    deleteEntry: async (id) => {
        set({ error: null });
        try {
            await entryApi.delete(id);
            set((state) => ({
                entries: state.entries.filter((e) => e.id !== id),
                total: state.total - 1,
            }));
        } catch (err) {
            set({ error: String(err) });
            throw err;
        }
    },

    resetEntries: () => {
        set({
            entries: [],
            total: 0,
            page: 0,
            hasMore: false,
            isLoading: false,
            isLoadingMore: false,
            error: null,
        });
    },

    clearError: () => {
        set({ error: null });
    },
}));
