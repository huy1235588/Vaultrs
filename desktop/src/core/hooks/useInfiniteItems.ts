/**
 * useInfiniteItems — Hook for cursor-based infinite scrolling of items.
 *
 * Manages loading items in batches using cursor-based pagination,
 * appending new batches as the user scrolls down. Designed to work
 * with TanStack Virtual for 10M+ record performance.
 *
 * Supports dynamic sorting (title, created_at, updated_at) and
 * title filtering with compound keyset cursors.
 *
 * @example
 * ```tsx
 * const { items, hasMore, loadMore, isLoading, total, reset } =
 *     useInfiniteItems({ collectionId, sortField: "title", sortOrder: "ASC" });
 * ```
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as itemService from "@/core/api/itemService";
import type { Item } from "@/core/types/common";
import type { SortField, SortOrder } from "@/core/types/common";

const BATCH_SIZE = 50;

interface UseInfiniteItemsOptions {
    /** The collection to load items from. */
    collectionId: number;
    /** Number of items per batch (default: 50). */
    batchSize?: number;
    /** External refresh trigger — increment to refetch from scratch. */
    refreshKey?: number;
    /** Sort field (default: "created_at"). */
    sortField?: SortField;
    /** Sort direction (default: "DESC"). */
    sortOrder?: SortOrder;
    /** Filter items by title (partial match, case-insensitive). */
    filterTitle?: string;
}

interface UseInfiniteItemsResult {
    /** All loaded items so far. */
    items: Item[];
    /** Whether there are more items to load. */
    hasMore: boolean;
    /** Total count of items (filtered). */
    total: number;
    /** Whether the initial load is in progress. */
    isLoading: boolean;
    /** Whether a "load more" fetch is in progress. */
    isFetchingMore: boolean;
    /** Error message, if any. */
    error: string | null;
    /** Load the next batch of items. */
    loadMore: () => void;
    /** Reset and refetch from the beginning. */
    reset: () => void;
}

/**
 * Extract the sort column value from an item for compound cursor.
 */
function getSortValue(item: Item, sortField: SortField): string {
    switch (sortField) {
        case "title":
            return item.title;
        case "created_at":
            return String(item.created_at);
        case "updated_at":
            return String(item.updated_at);
        default:
            return String(item.created_at);
    }
}

export function useInfiniteItems({
    collectionId,
    batchSize = BATCH_SIZE,
    refreshKey = 0,
    sortField = "created_at",
    sortOrder = "DESC",
    filterTitle,
}: UseInfiniteItemsOptions): UseInfiniteItemsResult {
    const [items, setItems] = useState<Item[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track if a fetch is in flight to prevent duplicate requests
    const fetchingRef = useRef(false);
    // Track params to detect stale fetches
    const paramsRef = useRef({ collectionId, sortField, sortOrder, filterTitle });

    // Update params ref
    paramsRef.current = { collectionId, sortField, sortOrder, filterTitle };

    // Fetch a batch of items
    const fetchBatch = useCallback(
        async (
            afterId?: number,
            afterSortValue?: string,
            isInitial = false,
        ) => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;

            if (isInitial) {
                setIsLoading(true);
            } else {
                setIsFetchingMore(true);
            }
            setError(null);

            // Snapshot current params to detect staleness
            const snapshot = { ...paramsRef.current };

            try {
                const response = await itemService.getItemsCursor(
                    collectionId,
                    {
                        after_id: afterId,
                        after_sort_value: afterSortValue,
                        limit: batchSize,
                        sort_field: sortField,
                        sort_order: sortOrder,
                        filter_title: filterTitle || undefined,
                    },
                );

                // If params changed while fetching, discard the result
                const current = paramsRef.current;
                if (
                    current.collectionId !== snapshot.collectionId ||
                    current.sortField !== snapshot.sortField ||
                    current.sortOrder !== snapshot.sortOrder ||
                    current.filterTitle !== snapshot.filterTitle
                ) {
                    return;
                }

                if (isInitial) {
                    setItems(response.data);
                } else {
                    setItems((prev) => [...prev, ...response.data]);
                }
                setHasMore(response.has_more);
                setTotal(response.total);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to load items";
                setError(message);
            } finally {
                setIsLoading(false);
                setIsFetchingMore(false);
                fetchingRef.current = false;
            }
        },
        [collectionId, batchSize, sortField, sortOrder, filterTitle],
    );

    // Load more items (next batch)
    const loadMore = useCallback(() => {
        if (!hasMore || fetchingRef.current) return;
        const lastItem = items[items.length - 1];
        if (lastItem) {
            const sortValue = getSortValue(lastItem, sortField);
            fetchBatch(lastItem.id, sortValue);
        }
    }, [items, hasMore, fetchBatch, sortField]);

    // Reset and refetch from scratch
    const reset = useCallback(() => {
        setItems([]);
        setHasMore(true);
        setTotal(0);
        setError(null);
        fetchingRef.current = false;
        fetchBatch(undefined, undefined, true);
    }, [fetchBatch]);

    // Initial load + reset on collection/sort/filter change
    useEffect(() => {
        setItems([]);
        setHasMore(true);
        setTotal(0);
        setError(null);
        fetchingRef.current = false;
        fetchBatch(undefined, undefined, true);
    }, [collectionId, refreshKey, sortField, sortOrder, filterTitle]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        items,
        hasMore,
        total,
        isLoading,
        isFetchingMore,
        error,
        loadMore,
        reset,
    };
}
