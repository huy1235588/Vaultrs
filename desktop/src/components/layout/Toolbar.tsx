// Toolbar component with search, view mode toggle, and action buttons

import { useCallback } from 'react';
import {
    Plus,
    LayoutGrid,
    LayoutList,
    Settings2,
    Command,
    Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useVaultStore } from '@/modules/vault';
import { useEntryStore, SearchInput } from '@/modules/entry';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';

export function Toolbar() {
    const {
        viewMode,
        setViewMode,
        setShowCreateEntry,
        setShowFieldManager,
        setCommandPaletteOpen,
    } = useUIStore();

    const { activeVaultId, activeVaultName } = useVaultStore(
        useShallow((s) => ({
            activeVaultId: s.activeVaultId,
            activeVaultName: s.vaults.find((v) => v.id === s.activeVaultId)?.name ?? null,
        }))
    );
    const { isSearching, searchEntries, clearSearch } = useEntryStore();

    const handleSearch = useCallback(
        (query: string) => {
            if (activeVaultId) {
                searchEntries(activeVaultId, query);
            }
        },
        [activeVaultId, searchEntries]
    );

    const handleClearSearch = useCallback(() => {
        clearSearch();
    }, [clearSearch]);

    return (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background">
            {/* Search section */}
            <div className="flex-1 max-w-md">
                <SearchInput
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    isSearching={isSearching}
                    placeholder="Search entries..."
                    className="w-full"
                />
            </div>

            {/* Center: Vault context breadcrumb */}
            <div className="flex-1 flex items-center justify-center">
                {activeVaultName && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground select-none">
                        <Archive className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{activeVaultName}</span>
                    </span>
                )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center rounded-md border border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'h-8 w-8 rounded-r-none',
                        viewMode === 'list' && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => setViewMode('list')}
                    title="List view"
                >
                    <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'h-8 w-8 rounded-l-none',
                        viewMode === 'grid' && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>

            {/* Visual separator */}
            <div className="w-px h-5 bg-border flex-shrink-0" aria-hidden="true" />

            {/* Action buttons */}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowFieldManager(true)}
                title="Manage fields"
                disabled={!activeVaultId}
            >
                <Settings2 className="h-4 w-4" />
            </Button>

            <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setShowCreateEntry(true)}
                disabled={!activeVaultId}
            >
                <Plus className="h-4 w-4" />
                New Entry
            </Button>

            {/* Command palette hint */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground"
                onClick={() => setCommandPaletteOpen(true)}
                title="Open command palette"
            >
                <Command className="h-3.5 w-3.5" />
                <kbd className="pointer-events-none text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                    Ctrl+K
                </kbd>
            </Button>
        </div>
    );
}
