/**
 * Asset API service — Tauri IPC wrappers for asset commands.
 */
import { tauriInvoke } from "./tauri";
import type { Asset, AssetRole, AssetWithRole } from "@/core/types/common";

// --- API Calls ---

/** Upload a local file as an asset for an item. */
export async function uploadAsset(
    itemId: number,
    role: AssetRole,
    filePath: string,
): Promise<AssetWithRole> {
    return tauriInvoke<AssetWithRole>("upload_asset", {
        itemId,
        role,
        filePath,
    });
}

/** Add a remote URL as an asset for an item. */
export async function addRemoteAsset(
    itemId: number,
    role: AssetRole,
    url: string,
    originalFilename?: string,
): Promise<AssetWithRole> {
    return tauriInvoke<AssetWithRole>("add_remote_asset", {
        itemId,
        role,
        url,
        originalFilename: originalFilename ?? null,
    });
}

/** Get all assets for an item (all roles). */
export async function getItemAssets(
    itemId: number,
): Promise<AssetWithRole[]> {
    return tauriInvoke<AssetWithRole[]>("get_item_assets", { itemId });
}

/** Get the cover asset for a single item. */
export async function getItemCover(
    itemId: number,
): Promise<Asset | null> {
    return tauriInvoke<Asset | null>("get_item_cover", { itemId });
}

/** Batch-get cover assets for multiple items (for Grid/List views). */
export async function getCoversBatch(
    itemIds: number[],
): Promise<Record<number, Asset | null>> {
    return tauriInvoke<Record<number, Asset | null>>("get_covers_batch", {
        itemIds,
    });
}

/** Set an existing asset as the cover for an item. */
export async function setItemCover(
    itemId: number,
    assetId: number,
): Promise<void> {
    return tauriInvoke<void>("set_item_cover", { itemId, assetId });
}

/** Delete an asset and its files. */
export async function deleteAsset(assetId: number): Promise<void> {
    return tauriInvoke<void>("delete_asset", { assetId });
}

/** Unlink an asset from an item (without deleting the asset). */
export async function unlinkAsset(itemAssetId: number): Promise<void> {
    return tauriInvoke<void>("unlink_asset", { itemAssetId });
}
