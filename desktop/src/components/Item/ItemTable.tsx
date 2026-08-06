/**
 * ItemTable — Virtualized table displaying items with infinite scroll.
 *
 * Uses TanStack Virtual for DOM virtualization and cursor-based pagination
 * for efficient data loading. Only visible rows are rendered in the DOM,
 * keeping memory footprint flat regardless of dataset size (10M+).
 */
import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    AlertCircle,
    ChevronRight,
    FileText,
    Loader2,
    Trash2,
} from "lucide-react";
import { useInfiniteItems } from "@/core/hooks/useInfiniteItems";
import { useItem } from "@/core/context/ItemContext";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { useState } from "react";
import type { Item } from "@/core/types/common";

interface ItemTableProps {
    collectionId: number;
    /** Incremented externally to trigger a refetch (e.g., after creating an item). */
    refreshKey?: number;
}

const ROW_HEIGHT = 48; // px — must match the rendered row height

/** Format a unix timestamp (seconds) to a locale date string. */
function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function ItemTable({ collectionId, refreshKey = 0 }: ItemTableProps) {
    const { selectItem } = useItem();
    const {
        items,
        hasMore,
        total,
        isLoading,
        isFetchingMore,
        error,
        loadMore,
        reset,
    } = useInfiniteItems({ collectionId, refreshKey });
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    // Scroll container ref for the virtualizer
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
    });

    // Load more items when scrolling near the bottom
    useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0) return;

        const lastItem = virtualItems[virtualItems.length - 1];
        if (!lastItem) return;

        // If the last virtual item is near the end of loaded data, load more
        if (lastItem.index >= items.length - 10 && hasMore && !isFetchingMore) {
            loadMore();
        }
    }, [rowVirtualizer.getVirtualItems(), items.length, hasMore, isFetchingMore, loadMore]);

    // --- Loading state (initial) ---
    if (isLoading && items.length === 0) {
        return (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="border-b border-border bg-muted/50 px-4 py-3">
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                            <div className="h-3.5 flex-1 rounded bg-muted animate-pulse" />
                            <div className="hidden h-3.5 w-20 rounded bg-muted animate-pulse sm:block" />
                            <div className="hidden h-3.5 w-20 rounded bg-muted animate-pulse sm:block" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Error state ---
    if (error && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="size-5" />
                </div>
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={reset}>
                    Try again
                </Button>
            </div>
        );
    }

    // --- Empty state ---
    if (!isLoading && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-7 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">
                        No items yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Add your first item to this collection.
                    </p>
                </div>
            </div>
        );
    }

    // --- Virtualized Table ---
    return (
        <div className="flex flex-col gap-3">
            {/* Item count indicator */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {items.length.toLocaleString()} of {total.toLocaleString()} items loaded
                </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
                {/* Table header (fixed) */}
                <div className="flex items-center border-b border-border bg-muted/50 px-4 py-2.5">
                    <span className="flex-1 text-xs font-medium text-muted-foreground">
                        Title
                    </span>
                    <span className="hidden w-32 text-xs font-medium text-muted-foreground sm:block">
                        Created
                    </span>
                    <span className="hidden w-32 text-xs font-medium text-muted-foreground sm:block">
                        Updated
                    </span>
                    <span className="w-16" />
                </div>

                {/* Virtualized scroll container */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-y-auto"
                    style={{ maxHeight: "calc(100vh - 280px)" }}
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const item = items[virtualRow.index];
                            if (!item) return null;

                            return (
                                <div
                                    key={item.id}
                                    className="group absolute left-0 flex w-full cursor-pointer items-center border-b border-border/50 px-4 transition-colors hover:bg-accent/40"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    onClick={() => selectItem(item.id)}
                                >
                                    {/* Title */}
                                    <span className="flex-1 truncate text-sm font-semibold text-foreground">
                                        {item.title}
                                    </span>

                                    {/* Created */}
                                    <span className="hidden w-32 text-xs tabular-nums text-muted-foreground sm:block">
                                        {formatDate(item.created_at)}
                                    </span>

                                    {/* Updated */}
                                    <span className="hidden w-32 text-xs tabular-nums text-muted-foreground sm:block">
                                        {formatDate(item.updated_at)}
                                    </span>

                                    {/* Actions */}
                                    <div
                                        className="flex w-16 items-center justify-end gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className="text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                                                    onClick={() => setDeleteTarget(item)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">Delete item</TooltipContent>
                                        </Tooltip>
                                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Loading more indicator */}
                    {isFetchingMore && (
                        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" />
                            Loading more items...
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <DeleteItemDialog
                    itemId={deleteTarget.id}
                    itemTitle={deleteTarget.title}
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    onDeleted={() => {
                        setDeleteTarget(null);
                        reset();
                    }}
                />
            )}
        </div>
    );
}

export default ItemTable;
