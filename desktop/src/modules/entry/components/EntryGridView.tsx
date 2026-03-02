// Entry grid view with virtual scrolling using TanStack Virtual

import { useEffect, useRef, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileText, SearchX } from 'lucide-react';
import { useEntryStore } from '../store';
import { useUIStore } from '@/stores/uiStore';
import { EntryGridCard } from './EntryGridCard';
import type { Entry } from '../types';

interface EntryGridViewProps {
    vaultId: number;
}

const MIN_CARD_WIDTH = 220;
const ROW_HEIGHT = 280;
const OVERSCAN = 3;

export function EntryGridView({ vaultId }: EntryGridViewProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(4);

    const { selectedEntryId, setSelectedEntryId, setDetailPanelOpen } = useUIStore();

    const {
        entries,
        total,
        hasMore,
        isLoading,
        isLoadingMore,
        fetchEntries,
        loadMoreEntries,
        searchQuery,
        searchResults,
        searchTotal,
        isSearching,
    } = useEntryStore();

    // Determine which entries to display
    const isSearchActive = searchQuery.length > 0;
    const displayEntries = isSearchActive ? searchResults : entries;
    const displayTotal = isSearchActive ? searchTotal : total;

    // Fetch entries when vault changes
    useEffect(() => {
        fetchEntries(vaultId);
    }, [vaultId, fetchEntries]);

    // ResizeObserver for dynamic column count
    useEffect(() => {
        const el = parentRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width - 32; // subtract padding
                const cols = Math.max(2, Math.floor(width / MIN_CARD_WIDTH));
                setColumns(cols);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Row count for virtualizer
    const rowCount = Math.ceil(displayEntries.length / columns);

    // Virtual grid setup
    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: OVERSCAN,
    });

    // Handle scroll to load more
    const handleScroll = useCallback(() => {
        if (isSearchActive) return;

        const scrollElement = parentRef.current;
        if (!scrollElement || isLoadingMore || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        if (scrollBottom < 200) {
            loadMoreEntries(vaultId);
        }
    }, [vaultId, isLoadingMore, hasMore, loadMoreEntries, isSearchActive]);

    // Attach scroll listener
    useEffect(() => {
        const scrollElement = parentRef.current;
        if (!scrollElement) return;

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleEntryClick = (entry: Entry) => {
        setSelectedEntryId(entry.id);
        setDetailPanelOpen(true);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex-1 p-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-lg bg-muted animate-pulse aspect-[3/4]" />
                    ))}
                </div>
            </div>
        );
    }

    // Search loading state
    if (isSearching) {
        return (
            <div className="flex-1 p-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-lg bg-muted animate-pulse aspect-[3/4]" />
                    ))}
                </div>
            </div>
        );
    }

    // No search results
    if (isSearchActive && displayEntries.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <SearchX className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    No entries match "<span className="font-medium">{searchQuery}</span>".
                    Try a different search term.
                </p>
            </div>
        );
    }

    // Empty state
    if (entries.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No entries yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Add your first entry to start building your collection.
                </p>
            </div>
        );
    }

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-y-auto"
            style={{ contain: 'strict' }}
        >
            <div
                style={{
                    height: virtualizer.getTotalSize(),
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualRow) => {
                    const startIndex = virtualRow.index * columns;
                    const rowEntries = displayEntries.slice(startIndex, startIndex + columns);
                    return (
                        <div
                            key={virtualRow.key}
                            className="absolute top-0 left-0 w-full px-4"
                            style={{
                                height: virtualRow.size,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div
                                className="grid gap-4"
                                style={{
                                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                }}
                            >
                                {rowEntries.map((entry) => (
                                    <EntryGridCard
                                        key={entry.id}
                                        entry={entry}
                                        onClick={() => handleEntryClick(entry)}
                                        isSelected={entry.id === selectedEntryId}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load more indicator */}
            {!isSearchActive && isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-muted-foreground">
                        Loading more entries...
                    </span>
                </div>
            )}

            {/* End of list */}
            {!isSearchActive && !hasMore && entries.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing all {total.toLocaleString()} entries
                </div>
            )}

            {/* Search results count */}
            {isSearchActive && displayEntries.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing {displayTotal.toLocaleString()} {displayTotal === 1 ? 'result' : 'results'} for "{searchQuery}"
                </div>
            )}
        </div>
    );
}
