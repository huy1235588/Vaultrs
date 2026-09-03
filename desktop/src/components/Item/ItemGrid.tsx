/**
 * ItemGrid — Virtualized grid layout displaying items as cards with infinite scroll.
 *
 * Uses TanStack Virtual for window-based virtualization of grid rows.
 * Only visible rows of cards are rendered, keeping memory footprint flat.
 * Integrates with useCoverImages for lazy-loading cover art.
 * Supports dynamic sorting and title filtering.
 */
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertCircle, FileText, Loader2, SearchX } from "lucide-react";
import { useInfiniteItems } from "@/core/hooks/useInfiniteItems";
import { useCoverImages } from "@/core/hooks/useCoverImages";
import { useItem } from "@/core/context/ItemContext";
import { useCollections } from "@/core/context/CollectionContext";
import { Button } from "@/components/ui/button";
import { ItemCard } from "./ItemCard";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { resolveAssetUrlSync } from "@/core/utils/assetResolver";
import { cn } from "@/lib/utils";
import type { Item, SortField, SortOrder } from "@/core/types/common";

interface ItemGridProps {
    collectionId: number;
    /** Incremented externally to trigger a refetch (e.g., after creating an item). */
    refreshKey?: number;
    /** Sort field (default: "created_at"). */
    sortField?: SortField;
    /** Sort direction (default: "DESC"). */
    sortOrder?: SortOrder;
    /** Filter items by title (debounced value). */
    filterTitle?: string;
    /** Whether to show title on grid cards (default: true). */
    showTitleOnCard?: boolean;
    /** Card size preset from collection settings (default: "MEDIUM"). */
    cardSize?: "SMALL" | "MEDIUM" | "LARGE";
    /** Callback to report total count (for filter badge). */
    onTotalChange?: (total: number) => void;
}

function getEstimatedRowHeight(
    cardSize: "SMALL" | "MEDIUM" | "LARGE" = "MEDIUM",
    showTitle: boolean = true,
): number {
    if (!showTitle) {
        switch (cardSize) {
            case "SMALL":
                return 150;
            case "LARGE":
                return 260;
            case "MEDIUM":
            default:
                return 190;
        }
    }
    switch (cardSize) {
        case "SMALL":
            return 200;
        case "LARGE":
            return 320;
        case "MEDIUM":
        default:
            return 255;
    }
}

/**
 * Calculate the number of columns based on container width.
 * Mirrors the CSS grid responsive breakpoints.
 */
function getColumnCount(width: number): number {
    if (width >= 1280) return 5; // xl
    if (width >= 1024) return 4; // lg
    if (width >= 640) return 3; // sm
    return 2; // default
}

function ItemGrid({
    collectionId,
    refreshKey = 0,
    sortField = "created_at",
    sortOrder = "DESC",
    filterTitle,
    showTitleOnCard = true,
    cardSize = "MEDIUM",
    onTotalChange,
}: ItemGridProps) {
    const { selectItem } = useItem();
    const { selectedCollection } = useCollections();
    const {
        items,
        hasMore,
        total,
        isLoading,
        isFetchingMore,
        error,
        loadMore,
        reset,
    } = useInfiniteItems({
        collectionId,
        batchSize: 60,
        refreshKey,
        sortField,
        sortOrder,
        filterTitle: filterTitle || undefined,
    });
    const { getCover, loadCovers, clearCovers } = useCoverImages();
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
    const [columnCount, setColumnCount] = useState(4);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Report total to parent (for filter badge)
    useEffect(() => {
        onTotalChange?.(total);
    }, [total, onTotalChange]);

    // Clear cover cache when collection or sort/filter changes
    useEffect(() => {
        clearCovers();
    }, [collectionId, sortField, sortOrder, filterTitle]); // eslint-disable-line react-hooks/exhaustive-deps

    // Track container width for responsive column count
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setColumnCount(getColumnCount(entry.contentRect.width));
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Number of rows needed to display all items
    const rowCount = Math.ceil(items.length / columnCount);

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => getEstimatedRowHeight(cardSize, showTitleOnCard),
        overscan: 3, // Render 3 extra rows above/below
    });

    // Load more items when scrolling near the bottom
    useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0) return;

        const lastVirtRow = virtualItems[virtualItems.length - 1];
        if (!lastVirtRow) return;

        // If last visible row is near the end, load more
        if (lastVirtRow.index >= rowCount - 3 && hasMore && !isFetchingMore) {
            loadMore();
        }
    }, [rowVirtualizer.getVirtualItems(), rowCount, hasMore, isFetchingMore, loadMore]);

    // Load covers for visible items
    useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0) return;

        // Collect all item IDs in visible rows
        const visibleIds: number[] = [];
        for (const vRow of virtualItems) {
            const startIndex = vRow.index * columnCount;
            const rowItems = items.slice(startIndex, startIndex + columnCount);
            for (const item of rowItems) {
                visibleIds.push(item.id);
            }
        }

        if (visibleIds.length > 0) {
            loadCovers(visibleIds);
        }
    }, [rowVirtualizer.getVirtualItems(), items, columnCount, loadCovers]);

    const collectionIcon = selectedCollection?.icon || "📁";
    const isFiltering = filterTitle && filterTitle.trim().length > 0;

    // --- Loading state (initial) ---
    if (isLoading && items.length === 0) {
        return (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-xl border border-border/40 bg-card"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div
                            className={cn(
                                "relative w-full bg-muted/20",
                                cardSize === "SMALL" && "aspect-[16/10]",
                                cardSize === "LARGE" && "aspect-[4/3]",
                                cardSize === "MEDIUM" && "aspect-[16/10]",
                            )}
                        >
                            <div className="absolute inset-0 animate-shimmer" />
                        </div>
                        {showTitleOnCard && (
                            <div className="space-y-2.5 p-3">
                                <div className="h-4 w-3/4 rounded-md bg-muted/30 animate-shimmer" />
                                <div className="h-3 w-1/2 rounded-md bg-muted/20 animate-shimmer" />
                            </div>
                        )}
                    </div>
                ))}
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

    // --- Empty state (no results from filter) ---
    if (!isLoading && items.length === 0 && isFiltering) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <SearchX className="size-7 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">
                        No matching items
                    </p>
                    <p className="text-xs text-muted-foreground">
                        No items match &ldquo;{filterTitle}&rdquo;. Try a
                        different search term.
                    </p>
                </div>
            </div>
        );
    }

    // --- Empty state (no items) ---
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

    return (
        <div className="flex flex-col gap-3">
            {/* Item count indicator */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {items.length.toLocaleString()} of {total.toLocaleString()} items loaded
                </p>
            </div>

            {/* Virtualized scroll container */}
            <div
                ref={scrollContainerRef}
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 300px)" }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const startIndex = virtualRow.index * columnCount;
                        const rowItems = items.slice(
                            startIndex,
                            startIndex + columnCount,
                        );

                        return (
                            <div
                                key={virtualRow.index}
                                className="absolute left-0 w-full"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    padding: "0 0 16px 0",
                                }}
                            >
                                <div
                                    className="grid h-full gap-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {rowItems.map((item) => (
                                        <ItemCard
                                            key={item.id}
                                            id={item.id}
                                            title={item.title}
                                            createdAt={item.created_at}
                                            updatedAt={item.updated_at}
                                            collectionIcon={collectionIcon}
                                            cover={getCover(item.id)}
                                            resolveAssetUrl={resolveAssetUrlSync}
                                            showTitle={showTitleOnCard}
                                            cardSize={cardSize}
                                            onClick={() =>
                                                selectItem(item.id)
                                            }
                                            onDelete={() =>
                                                setDeleteTarget(item)
                                            }
                                        />
                                    ))}
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

export default ItemGrid;
export { ItemGrid };
