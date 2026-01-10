// Entry list with virtual scrolling using TanStack Virtual

import { useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileText } from 'lucide-react';
import { useEntryStore } from '../../stores';
import { EntryRow } from './EntryRow';
import { EntryRowSkeleton } from './EntryRowSkeleton';

interface EntryListProps {
    vaultId: number;
}

const ROW_HEIGHT = 72; // Estimated row height in pixels
const OVERSCAN = 5; // Number of items to render outside viewport

export function EntryList({ vaultId }: EntryListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const {
        entries,
        total,
        hasMore,
        isLoading,
        isLoadingMore,
        fetchEntries,
        loadMoreEntries,
        deleteEntry,
    } = useEntryStore();

    // Fetch entries when vault changes
    useEffect(() => {
        fetchEntries(vaultId);
    }, [vaultId, fetchEntries]);

    // Virtual list setup
    const virtualizer = useVirtualizer({
        count: entries.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: OVERSCAN,
    });

    // Handle scroll to load more
    const handleScroll = useCallback(() => {
        const scrollElement = parentRef.current;
        if (!scrollElement || isLoadingMore || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        // Load more when within 200px of bottom
        if (scrollBottom < 200) {
            loadMoreEntries(vaultId);
        }
    }, [vaultId, isLoadingMore, hasMore, loadMoreEntries]);

    // Attach scroll listener
    useEffect(() => {
        const scrollElement = parentRef.current;
        if (!scrollElement) return;

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

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
                className="relative w-full p-4"
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualItems.map((virtualRow) => {
                    const entry = entries[virtualRow.index];
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
                                onDelete={() => deleteEntry(entry.id)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Load more indicator */}
            {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-muted-foreground">
                        Loading more entries...
                    </span>
                </div>
            )}

            {/* End of list */}
            {!hasMore && entries.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing all {total.toLocaleString()} entries
                </div>
            )}
        </div>
    );
}
