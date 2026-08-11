/**
 * CollectionSettings API service — Tauri IPC wrappers.
 */
import { tauriInvoke } from "./tauri";
import type {
    CollectionSettings,
    AppearanceSettings,
    MediaSettings,
    BehaviorSettings,
} from "@/core/types/common";

// --- DTOs ---

export interface UpdateSettingsDto {
    appearance?: Partial<AppearanceSettings>;
    media?: Partial<MediaSettings>;
    behavior?: Partial<BehaviorSettings>;
}

// --- API Calls ---

/** Get parsed settings for a collection. */
export async function getSettings(
    collectionId: number,
): Promise<CollectionSettings> {
    return tauriInvoke<CollectionSettings>("get_collection_settings", {
        collectionId,
    });
}

/** Update settings for a collection (merge). */
export async function updateSettings(
    collectionId: number,
    dto: UpdateSettingsDto,
): Promise<CollectionSettings> {
    return tauriInvoke<CollectionSettings>("update_collection_settings", {
        collectionId,
        dto,
    });
}
