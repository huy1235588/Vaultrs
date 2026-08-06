/**
 * useInfiniteItems — Hook for cursor-based infinite scrolling of items.
 *
 * Manages loading items in batches using cursor-based pagination,
 * appending new batches as the user scrolls down. Designed to work
 * with TanStack Virtual for 10M+ record performance.
 *
 * @example
 * ```tsx
 * const { items, hasMore, loadMore, isLoading, total, reset } =
 *     useInfiniteItems(collectionId);
 * ```
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as itemService from "@/core/api/itemService";
import type { Item } from "@/core/types/common";

const BATCH_SIZE = 50;

interface UseInfiniteItemsOptions {
    /** The collection to load items from. */
    collectionId: number;
    /** Number of items per batch (default: 50). */
    batchSize?: number;
    /** External refresh trigger — increment to refetch from scratch. */
    refreshKey?: number;
}

interface UseInfiniteItemsResult {
    /** All loaded items so far. */
    items: Item[];
    /** Whether there are more items to load. */
    hasMore: boolean;
    /** Total count of items in the collection. */
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

export function useInfiniteItems({
    collectionId,
    batchSize = BATCH_SIZE,
    refreshKey = 0,
}: UseInfiniteItemsOptions): UseInfiniteItemsResult {
    const [items, setItems] = useState<Item[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track if a fetch is in flight to prevent duplicate requests
    const fetchingRef = useRef(false);
    // Track the collection to detect changes
    const collectionIdRef = useRef(collectionId);

    // Fetch a batch of items
    const fetchBatch = useCallback(
        async (afterId?: number, isInitial = false) => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;

            if (isInitial) {
                setIsLoading(true);
            } else {
                setIsFetchingMore(true);
            }
            setError(null);

            try {
                const response = await itemService.getItemsCursor(
                    collectionId,
                    {
                        after_id: afterId,
                        limit: batchSize,
                    },
                );

                // If collection changed while fetching, discard the result
                if (collectionIdRef.current !== collectionId) return;

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
        [collectionId, batchSize],
    );

    // Load more items (next batch)
    const loadMore = useCallback(() => {
        if (!hasMore || fetchingRef.current) return;
        const lastItem = items[items.length - 1];
        if (lastItem) {
            fetchBatch(lastItem.id);
        }
    }, [items, hasMore, fetchBatch]);

    // Reset and refetch from scratch
    const reset = useCallback(() => {
        setItems([]);
        setHasMore(true);
        setTotal(0);
        setError(null);
        fetchingRef.current = false;
        fetchBatch(undefined, true);
    }, [fetchBatch]);

    // Initial load + reset on collection change
    useEffect(() => {
        collectionIdRef.current = collectionId;
        setItems([]);
        setHasMore(true);
        setTotal(0);
        setError(null);
        fetchingRef.current = false;
        fetchBatch(undefined, true);
    }, [collectionId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
