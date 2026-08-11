/**
 * useCoverImages — Hook for batch-loading cover images for item lists.
 *
 * Designed to integrate with virtualized list/grid views.
 * Loads covers in batches as new items become visible, and caches
 * results in a Map to avoid redundant fetches.
 *
 * @example
 * ```tsx
 * const { getCover, loadCovers } = useCoverImages();
 * // Call loadCovers when new items enter viewport
 * loadCovers(visibleItemIds);
 * // Access cached cover for rendering
 * const cover = getCover(itemId); // Asset | null | undefined (undefined = not loaded)
 * ```
 */
import { useCallback, useRef, useState } from "react";
import * as assetService from "@/core/api/assetService";
import type { Asset } from "@/core/types/common";

interface UseCoverImagesResult {
    /**
     * Get the cached cover for an item.
     * - `undefined` = not yet loaded (show placeholder)
     * - `null` = loaded but no cover exists (show fallback)
     * - `Asset` = cover is available
     */
    getCover: (itemId: number) => Asset | null | undefined;
    /** Request covers for a batch of item IDs. Already-loaded items are skipped. */
    loadCovers: (itemIds: number[]) => void;
    /** Clear all cached covers (e.g., on collection change). */
    clearCovers: () => void;
}

export function useCoverImages(): UseCoverImagesResult {
    // Map<itemId, Asset | null> — cache of loaded covers
    const [coverMap, setCoverMap] = useState<Map<number, Asset | null>>(
        new Map(),
    );
    // Set of item IDs currently being fetched to prevent duplicates
    const pendingRef = useRef<Set<number>>(new Set());

    const getCover = useCallback(
        (itemId: number): Asset | null | undefined => {
            return coverMap.get(itemId);
        },
        [coverMap],
    );

    const loadCovers = useCallback(
        (itemIds: number[]) => {
            // Filter out already loaded or pending items
            const toLoad = itemIds.filter(
                (id) => !coverMap.has(id) && !pendingRef.current.has(id),
            );

            if (toLoad.length === 0) return;

            // Mark as pending
            toLoad.forEach((id) => pendingRef.current.add(id));

            // Fetch in background
            assetService
                .getCoversBatch(toLoad)
                .then((result) => {
                    setCoverMap((prev) => {
                        const next = new Map(prev);
                        for (const id of toLoad) {
                            next.set(id, result[id] ?? null);
                        }
                        return next;
                    });
                })
                .catch((err) => {
                    console.error("Failed to load covers:", err);
                    // On error, mark items as no-cover to prevent infinite retries
                    setCoverMap((prev) => {
                        const next = new Map(prev);
                        for (const id of toLoad) {
                            next.set(id, null);
                        }
                        return next;
                    });
                })
                .finally(() => {
                    toLoad.forEach((id) => pendingRef.current.delete(id));
                });
        },
        [coverMap],
    );

    const clearCovers = useCallback(() => {
        setCoverMap(new Map());
        pendingRef.current.clear();
    }, []);

    return { getCover, loadCovers, clearCovers };
}
