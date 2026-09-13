/**
 * ItemGrid — Virtualized grid display of collection items.
 *
 * Supports customizable card width & height, dynamic responsive columns,
 * cover images, title toggling, and rich metadata attribute display.
 */
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FileText, Loader2, Search } from "lucide-react";
import { useItem } from "@/core/context/ItemContext";
import { useCollections } from "@/core/context/CollectionContext";
import { useInfiniteItems } from "@/core/hooks/useInfiniteItems";
import { useCoverImages } from "@/core/hooks/useCoverImages";
import { resolveAssetUrlSync } from "@/core/utils/assetResolver";
import { ItemCard } from "@/components/Item/ItemCard";
import { DeleteItemDialog } from "@/components/Item/DeleteItemDialog";
import type { Item, SortField, SortOrder } from "@/core/types/common";

interface ItemGridProps {
    collectionId: number;
    refreshKey?: number;
    sortField?: SortField;
    sortOrder?: SortOrder;
    /** Filter items by title (debounced value). */
    filterTitle?: string;
    /** Whether to show title on grid cards (default: true). */
    showTitleOnCard?: boolean;
    /** Whether to show custom fields/metadata on cards (default: true). */
    showPropertiesOnCard?: boolean;
    /** Whether to show date on cards (default: true). */
    showDateOnCard?: boolean;
    /** Card width in px. */
    cardWidth?: number;
    /** Card cover height in px. */
    cardHeight?: number;
    /** Card size preset (default: "MEDIUM"). */
    cardSize?: "SMALL" | "MEDIUM" | "LARGE";
    /** Callback to report total count (for filter badge). */
    onTotalChange?: (total: number) => void;
}

function ItemGrid({
    collectionId,
    refreshKey = 0,
    sortField = "created_at",
    sortOrder = "DESC",
    filterTitle,
    showTitleOnCard = true,
    showPropertiesOnCard = true,
    showDateOnCard = true,
    cardWidth,
    cardHeight,
    cardSize = "MEDIUM",
    onTotalChange,
}: ItemGridProps) {
    const { selectItem } = useItem();
    const { selectedCollection, attributes } = useCollections();

    const effectiveCardWidth = cardWidth ?? (cardSize === "SMALL" ? 160 : cardSize === "LARGE" ? 260 : 200);
    const effectiveCardHeight = cardHeight ?? (cardSize === "SMALL" ? 220 : cardSize === "LARGE" ? 360 : 280);

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

    // Dynamic responsive column count based on container width and cardWidth
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const updateCols = (width: number) => {
            const gap = 16;
            const cols = Math.max(1, Math.min(10, Math.floor((width + gap) / (effectiveCardWidth + gap))));
            setColumnCount(cols);
        };

        updateCols(container.clientWidth);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                updateCols(entry.contentRect.width);
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [effectiveCardWidth]);

    // Number of rows needed to display all items
    const rowCount = Math.ceil(items.length / columnCount);

    // Dynamic row height calculation
    const extraInfoHeight = showTitleOnCard
        ? (showPropertiesOnCard ? 75 : 45) + (showDateOnCard ? 15 : 0)
        : 0;
    const estimatedRowHeight = effectiveCardHeight + extraInfoHeight + 16;

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => estimatedRowHeight,
        overscan: 3,
    });

    // Reset list and reload when collection or sort changes
    useEffect(() => {
        reset();
    }, [collectionId, sortField, sortOrder, filterTitle, reset]);

    // Infinite scroll trigger
    useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0) return;

        const lastVirtRow = virtualItems[virtualItems.length - 1];
        if (!lastVirtRow) return;

        if (lastVirtRow.index >= rowCount - 3 && hasMore && !isFetchingMore) {
            loadMore();
        }
    }, [rowVirtualizer, rowCount, hasMore, isFetchingMore, loadMore]);

    // Viewport-aware cover loading
    useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0) return;

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
    }, [rowVirtualizer, items, columnCount, loadCovers]);

    const collectionIcon = selectedCollection?.icon ?? undefined;

    // --- Error state ---
    if (error && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <FileText className="size-6" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">
                        Failed to load items
                    </p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    // --- Initial loading state ---
    if (isLoading && items.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Loading items...
                </div>
            </div>
        );
    }

    // --- Empty search/filter result ---
    if (items.length === 0 && filterTitle && filterTitle.trim().length > 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Search className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        No matching items
                    </p>
                    <p className="text-xs text-muted-foreground">
                        No items match &ldquo;{filterTitle}&rdquo;. Try a different search term.
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
                                            properties={item.properties}
                                            attributes={attributes}
                                            collectionIcon={collectionIcon}
                                            cover={getCover(item.id)}
                                            resolveAssetUrl={resolveAssetUrlSync}
                                            showTitle={showTitleOnCard}
                                            showProperties={showPropertiesOnCard}
                                            showDate={showDateOnCard}
                                            cardHeight={effectiveCardHeight}
                                            cardSize={cardSize}
                                            onClick={() => selectItem(item.id)}
                                            onDelete={() => setDeleteTarget(item)}
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
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        Loading more items...
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            {deleteTarget && (
                <DeleteItemDialog
                    item={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(v) => !v && setDeleteTarget(null)}
                />
            )}
        </div>
    );
}

export { ItemGrid };
export default ItemGrid;
