/**
 * ItemTable — Virtualized table displaying items with infinite scroll.
 *
 * Uses TanStack Virtual for DOM virtualization and cursor-based pagination
 * for efficient data loading. Only visible rows are rendered in the DOM,
 * keeping memory footprint flat regardless of dataset size (10M+).
 * Includes optional thumbnail column showing cover images.
 * Supports dynamic sorting via clickable column headers and title filtering.
 */
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    ChevronRight,
    FileText,
    ImageIcon,
    Loader2,
    SearchX,
    Trash2,
} from "lucide-react";
import { useInfiniteItems } from "@/core/hooks/useInfiniteItems";
import { useCoverImages } from "@/core/hooks/useCoverImages";
import { useItem } from "@/core/context/ItemContext";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { resolveAssetUrlSync } from "@/core/utils/assetResolver";
import { cn } from "@/lib/utils";
import type { Item, Asset, SortField, SortOrder } from "@/core/types/common";

interface ItemTableProps {
    collectionId: number;
    /** Incremented externally to trigger a refetch (e.g., after creating an item). */
    refreshKey?: number;
    /** Sort field (default: "created_at"). */
    sortField?: SortField;
    /** Sort direction (default: "DESC"). */
    sortOrder?: SortOrder;
    /** Filter items by title (debounced value). */
    filterTitle?: string;
    /** Callback when user clicks a column header to change sort. */
    onSortChange?: (field: SortField, order: SortOrder) => void;
    /** Callback to report total count (for filter badge). */
    onTotalChange?: (total: number) => void;
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

/** Resolve the best URL for a cover thumbnail. */
function getThumbnailUrl(
    cover: Asset | null | undefined,
): string | null {
    if (!cover || cover.state !== "READY") return null;
    if (cover.source_type === "REMOTE" && cover.source_url) return cover.source_url;
    if (cover.thumbnail_path) return resolveAssetUrlSync(cover.thumbnail_path);
    if (cover.relative_path) return resolveAssetUrlSync(cover.relative_path);
    return null;
}

/** Sortable column header component. */
function SortableHeader({
    label,
    field,
    activeField,
    activeOrder,
    onSort,
    className,
}: {
    label: string;
    field: SortField;
    activeField: SortField;
    activeOrder: SortOrder;
    onSort: (field: SortField, order: SortOrder) => void;
    className?: string;
}) {
    const isActive = activeField === field;
    const SortIcon = isActive && activeOrder === "ASC" ? ArrowUp : ArrowDown;

    const handleClick = () => {
        if (isActive) {
            // Toggle direction
            onSort(field, activeOrder === "ASC" ? "DESC" : "ASC");
        } else {
            // New field: default to DESC for dates, ASC for title
            const defaultOrder = field === "title" ? "ASC" : "DESC";
            onSort(field, defaultOrder);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                "group/sort flex items-center gap-1 text-xs font-medium transition-colors",
                isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                className,
            )}
        >
            {label}
            <SortIcon
                className={cn(
                    "size-3 transition-opacity",
                    isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover/sort:opacity-50",
                )}
            />
        </button>
    );
}

function ItemTable({
    collectionId,
    refreshKey = 0,
    sortField = "created_at",
    sortOrder = "DESC",
    filterTitle,
    onSortChange,
    onTotalChange,
}: ItemTableProps) {
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
    } = useInfiniteItems({
        collectionId,
        refreshKey,
        sortField,
        sortOrder,
        filterTitle: filterTitle || undefined,
    });
    const { getCover, loadCovers, clearCovers } = useCoverImages();
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    // Scroll container ref for the virtualizer
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Report total to parent (for filter badge)
    useEffect(() => {
        onTotalChange?.(total);
    }, [total, onTotalChange]);

    // Clear cover cache when collection or sort/filter changes
    useEffect(() => {
        clearCovers();
    }, [collectionId, sortField, sortOrder, filterTitle]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Load covers for visible items
    useEffect(() => {
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0) return;

        const visibleIds = virtualItems
            .map((vRow) => items[vRow.index]?.id)
            .filter((id): id is number => id !== undefined);

        if (visibleIds.length > 0) {
            loadCovers(visibleIds);
        }
    }, [rowVirtualizer.getVirtualItems(), items, loadCovers]);

    const handleSort = (field: SortField, order: SortOrder) => {
        onSortChange?.(field, order);
    };

    const isFiltering = filterTitle && filterTitle.trim().length > 0;

    // --- Loading state (initial) ---
    if (isLoading && items.length === 0) {
        return (
            <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
                <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
                    <div className="h-3 w-24 rounded-md bg-muted/30 animate-shimmer" />
                </div>
                <div className="divide-y divide-border/30">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5" style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="size-8 shrink-0 rounded-lg bg-muted/20 animate-shimmer" />
                            <div className="h-3.5 flex-1 rounded-md bg-muted/20 animate-shimmer" />
                            <div className="hidden h-3.5 w-20 rounded-md bg-muted/15 animate-shimmer sm:block" />
                            <div className="hidden h-3.5 w-20 rounded-md bg-muted/15 animate-shimmer sm:block" />
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

    // --- Virtualized Table ---
    return (
        <div className="flex flex-col gap-3">
            {/* Item count indicator */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {items.length.toLocaleString()} of {total.toLocaleString()} items loaded
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                {/* Table header (fixed) — clickable columns for sorting */}
                <div className="flex items-center border-b border-border/60 bg-muted/30 px-4 py-2.5">
                    {/* Thumbnail column header */}
                    <span className="w-10 shrink-0" />
                    <div className="flex-1">
                        <SortableHeader
                            label="Title"
                            field="title"
                            activeField={sortField}
                            activeOrder={sortOrder}
                            onSort={handleSort}
                        />
                    </div>
                    <div className="hidden w-32 sm:block">
                        <SortableHeader
                            label="Created"
                            field="created_at"
                            activeField={sortField}
                            activeOrder={sortOrder}
                            onSort={handleSort}
                        />
                    </div>
                    <div className="hidden w-32 sm:block">
                        <SortableHeader
                            label="Updated"
                            field="updated_at"
                            activeField={sortField}
                            activeOrder={sortOrder}
                            onSort={handleSort}
                        />
                    </div>
                    <span className="w-16" />
                </div>

                {/* Virtualized scroll container */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-y-auto"
                    style={{ maxHeight: "calc(100vh - 320px)" }}
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

                            const cover = getCover(item.id);
                            const thumbUrl = getThumbnailUrl(cover);

                            return (
                                <div
                                    key={item.id}
                                    className="group absolute left-0 flex w-full cursor-pointer items-center border-b border-border/30 px-4 transition-all duration-200 hover:bg-accent/30"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    onClick={() => selectItem(item.id)}
                                >
                                    {/* Hover accent bar */}
                                    <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-primary opacity-0 transition-all duration-200 group-hover:opacity-100" />
                                    {/* Thumbnail */}
                                    <div className="mr-3 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
                                        {thumbUrl ? (
                                            <img
                                                src={thumbUrl}
                                                alt=""
                                                className="size-8 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                                                draggable={false}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <ImageIcon className="size-3.5 text-muted-foreground/30" />
                                        )}
                                    </div>

                                    {/* Title */}
                                    <span className="flex-1 truncate text-sm font-semibold text-foreground group-hover:text-primary/90 transition-colors duration-200">
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
