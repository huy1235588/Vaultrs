/**
 * Relation API service — Tauri IPC wrappers for cross-collection linking commands.
 */
import { tauriInvoke } from "./tauri";
import type {
    BackReference,
    ReferencedItem,
    ResolvedReferencesResponse,
} from "@/core/types/common";

// --- API Calls ---

/** Resolve reference IDs stored in an item's properties into enriched item data. */
export async function resolveReferences(
    itemId: number,
    attributeKeys: string[],
): Promise<ResolvedReferencesResponse> {
    return tauriInvoke<ResolvedReferencesResponse>("resolve_references", {
        itemId,
        attributeKeys,
    });
}

/** Search items in a target collection for the reference picker. */
export async function searchReferenceTargets(
    collectionId: number,
    query?: string,
    excludeIds?: number[],
    limit?: number,
): Promise<ReferencedItem[]> {
    return tauriInvoke<ReferencedItem[]>("search_reference_targets", {
        dto: {
            collection_id: collectionId,
            query: query || null,
            exclude_ids: excludeIds && excludeIds.length > 0 ? excludeIds : null,
            limit: limit ?? null,
        },
    });
}

/** Find all items from other collections that reference a given item. */
export async function getBackReferences(
    itemId: number,
): Promise<BackReference[]> {
    return tauriInvoke<BackReference[]>("get_back_references", { itemId });
}
