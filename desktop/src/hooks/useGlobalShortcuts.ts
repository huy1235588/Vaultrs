// Global keyboard shortcuts hook

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function useGlobalShortcuts() {
    const {
        toggleSidebar,
        setCommandPaletteOpen,
        setDetailPanelOpen,
        setViewMode,
        commandPaletteOpen,
        detailPanelOpen,
    } = useUIStore();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            // Ctrl+K: Toggle command palette
            if (mod && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(!commandPaletteOpen);
                return;
            }

            // Ctrl+B: Toggle sidebar
            if (mod && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
                return;
            }

            // Ctrl+\: Toggle detail panel
            if (mod && e.key === '\\') {
                e.preventDefault();
                setDetailPanelOpen(!detailPanelOpen);
                return;
            }

            // Ctrl+1: List view
            if (mod && e.key === '1') {
                e.preventDefault();
                setViewMode('list');
                return;
            }

            // Ctrl+2: Grid view
            if (mod && e.key === '2') {
                e.preventDefault();
                setViewMode('grid');
                return;
            }

            // Escape: Close detail panel or command palette
            if (e.key === 'Escape') {
                if (commandPaletteOpen) {
                    setCommandPaletteOpen(false);
                    return;
                }
                if (detailPanelOpen) {
                    setDetailPanelOpen(false);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [
        toggleSidebar,
        setCommandPaletteOpen,
        setDetailPanelOpen,
        setViewMode,
        commandPaletteOpen,
        detailPanelOpen,
    ]);
}
