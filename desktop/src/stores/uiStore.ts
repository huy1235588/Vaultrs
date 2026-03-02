// UI state store using Zustand with persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    // Sidebar
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // View mode
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;

    // Detail panel
    detailPanelOpen: boolean;
    detailPanelWidth: number;
    setDetailPanelOpen: (open: boolean) => void;
    setDetailPanelWidth: (width: number) => void;

    // Theme
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    // Command palette
    commandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;

    // Selected entry for detail panel
    selectedEntryId: number | null;
    setSelectedEntryId: (id: number | null) => void;

    // Auto edit mode — set before opening detail panel to start in edit mode
    autoEditMode: boolean;
    setAutoEditMode: (value: boolean) => void;

    // Dialog state
    showCreateVault: boolean;
    setShowCreateVault: (show: boolean) => void;
    showCreateEntry: boolean;
    setShowCreateEntry: (show: boolean) => void;
    showFieldManager: boolean;
    setShowFieldManager: (show: boolean) => void;
    showDeleteVault: boolean;
    setShowDeleteVault: (show: boolean) => void;
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else if (theme === 'light') {
        root.classList.remove('dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
    }
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Sidebar
            sidebarCollapsed: false,
            toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

            // View mode
            viewMode: 'list',
            setViewMode: (mode) => set({ viewMode: mode }),

            // Detail panel
            detailPanelOpen: false,
            detailPanelWidth: 400,
            setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
            setDetailPanelWidth: (width) =>
                set({ detailPanelWidth: Math.max(320, Math.min(600, width)) }),

            // Theme
            theme: 'dark',
            setTheme: (theme) => {
                applyTheme(theme);
                set({ theme });
            },

            // Command palette
            commandPaletteOpen: false,
            setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

            // Selected entry
            selectedEntryId: null,
            setSelectedEntryId: (id) => set({ selectedEntryId: id }),

            // Auto edit mode
            autoEditMode: false,
            setAutoEditMode: (value) => set({ autoEditMode: value }),

            // Dialogs
            showCreateVault: false,
            setShowCreateVault: (show) => set({ showCreateVault: show }),
            showCreateEntry: false,
            setShowCreateEntry: (show) => set({ showCreateEntry: show }),
            showFieldManager: false,
            setShowFieldManager: (show) => set({ showFieldManager: show }),
            showDeleteVault: false,
            setShowDeleteVault: (show) => set({ showDeleteVault: show }),
        }),
        {
            name: 'vaultrs-ui-settings',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                viewMode: state.viewMode,
                detailPanelWidth: state.detailPanelWidth,
                theme: state.theme,
            }),
            onRehydrateStorage: () => {
                return (state?: UIState) => {
                    if (state) {
                        applyTheme(state.theme);
                    }
                };
            },
        }
    )
);

// Initialize theme on module load
export function initializeTheme() {
    try {
        const stored = localStorage.getItem('vaultrs-ui-settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            const theme = parsed?.state?.theme || 'dark';
            applyTheme(theme);
        } else {
            applyTheme('dark');
        }
    } catch {
        applyTheme('dark');
    }
}
