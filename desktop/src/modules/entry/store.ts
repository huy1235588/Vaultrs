// Entry store using Zustand

import { create } from 'zustand';
import type { Entry, CreateEntryParams, UpdateEntryParams } from './types';
import { entryApi } from './api';

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

    // Search state
    searchQuery: string;
    searchResults: Entry[];
    searchTotal: number;
    isSearching: boolean;

    // Actions
    fetchEntries: (vaultId: number, reset?: boolean) => Promise<void>;
    loadMoreEntries: (vaultId: number) => Promise<void>;
    createEntry: (params: CreateEntryParams) => Promise<Entry>;
    updateEntry: (id: number, params: UpdateEntryParams) => Promise<Entry>;
    deleteEntry: (id: number) => Promise<void>;
    resetEntries: () => void;
    clearError: () => void;

    // Search actions
    searchEntries: (vaultId: number, query: string) => Promise<void>;
    clearSearch: () => void;
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

    // Search initial state
    searchQuery: '',
    searchResults: [],
    searchTotal: 0,
    isSearching: false,

    // Actions
    fetchEntries: async (vaultId, reset = true) => {
        if (reset) {
            // Clear search state when switching vaults
            set({
                isLoading: true,
                error: null,
                entries: [],
                page: 0,
                searchQuery: '',
                searchResults: [],
                searchTotal: 0,
                isSearching: false,
            });
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
        const { page, hasMore, isLoadingMore, searchQuery } = get();

        // Don't load more if searching
        if (searchQuery) return;
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
                // Also update search results if present
                searchResults: state.searchResults.map((e) => (e.id === id ? updated : e)),
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
                // Also remove from search results if present
                searchResults: state.searchResults.filter((e) => e.id !== id),
                searchTotal: state.searchResults.some((e) => e.id === id)
                    ? state.searchTotal - 1
                    : state.searchTotal,
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
            // Also reset search
            searchQuery: '',
            searchResults: [],
            searchTotal: 0,
            isSearching: false,
        });
    },

    clearError: () => {
        set({ error: null });
    },

    // Search actions
    searchEntries: async (vaultId, query) => {
        const trimmedQuery = query.trim();

        // Clear search if query is empty
        if (!trimmedQuery) {
            set({
                searchQuery: '',
                searchResults: [],
                searchTotal: 0,
                isSearching: false,
            });
            return;
        }

        set({ searchQuery: trimmedQuery, isSearching: true, error: null });

        try {
            const result = await entryApi.search(vaultId, trimmedQuery, 0, DEFAULT_LIMIT);
            set({
                searchResults: result.entries,
                searchTotal: result.total,
                isSearching: false,
            });
        } catch (err) {
            set({ error: String(err), isSearching: false });
            throw err;
        }
    },

    clearSearch: () => {
        set({
            searchQuery: '',
            searchResults: [],
            searchTotal: 0,
            isSearching: false,
        });
    },
}));
