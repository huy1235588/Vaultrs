// Entry list with virtual scrolling using TanStack Virtual

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileText, SearchX } from 'lucide-react';
import { useEntryStore } from '../store';
import { EntryRow } from './EntryRow';
import { EntryRowSkeleton } from './EntryRowSkeleton';
import { EntryDetailDialog } from './EntryDetailDialog';
import type { Entry } from '../types';

interface EntryListProps {
    vaultId: number;
}

const ROW_HEIGHT = 72; // Estimated row height in pixels
const OVERSCAN = 5; // Number of items to render outside viewport

export function EntryList({ vaultId }: EntryListProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const {
        entries,
        total,
        hasMore,
        isLoading,
        isLoadingMore,
        fetchEntries,
        loadMoreEntries,
        deleteEntry,
        // Search state
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

    // Virtual list setup
    const virtualizer = useVirtualizer({
        count: displayEntries.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: OVERSCAN,
    });

    // Handle scroll to load more (only when not searching)
    const handleScroll = useCallback(() => {
        if (isSearchActive) return; // Don't load more while searching

        const scrollElement = parentRef.current;
        if (!scrollElement || isLoadingMore || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        // Load more when within 200px of bottom
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
        setSelectedEntry(entry);
        setIsDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        // Reset selected entry after animation completes
        setTimeout(() => setSelectedEntry(null), 200);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex-1 p-4 space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                    <EntryRowSkeleton key={i} />
                ))}
            </div>
        );
    }

    // Search loading state
    if (isSearching) {
        return (
            <div className="flex-1 p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <EntryRowSkeleton key={i} />
                ))}
            </div>
        );
    }

    // No search results state
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

    // Empty state (no entries at all)
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
        <>
            <div
                ref={parentRef}
                className="flex-1 overflow-y-auto"
                style={{ contain: 'strict' }}
            >
                <div
                    className="relative w-full p-4"
                    style={{ height: virtualizer.getTotalSize() }}
                >
                    {virtualItems.map((virtualRow) => {
                        const entry = displayEntries[virtualRow.index];
                        return (
                            <div
                                key={entry.id}
                                className="absolute top-0 left-0 w-full px-4"
                                style={{
                                    height: virtualRow.size,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <EntryRow
                                    entry={entry}
                                    onClick={() => handleEntryClick(entry)}
                                    onDelete={() => deleteEntry(entry.id)}
                                    searchQuery={searchQuery}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Load more indicator (only when not searching) */}
                {!isSearchActive && isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="ml-2 text-sm text-muted-foreground">
                            Loading more entries...
                        </span>
                    </div>
                )}

                {/* End of list indicator */}
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

            {/* Entry Detail Dialog */}
            <EntryDetailDialog
                entry={selectedEntry}
                isOpen={isDetailOpen}
                onClose={handleCloseDetail}
                vaultId={vaultId}
            />
        </>
    );
}
