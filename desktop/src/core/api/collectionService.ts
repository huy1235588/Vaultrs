/**
 * Collection API service — Tauri IPC wrappers for collection commands.
 */
import { tauriInvoke } from "./tauri";
import type { Collection } from "@/core/types/common";

// --- DTOs ---

export interface CreateCollectionDto {
    name: string;
    slug?: string;
    icon?: string;
    description?: string;
}

export interface UpdateCollectionDto {
    name?: string;
    icon?: string;
    description?: string;
}

// --- API Calls ---

/** Fetch all collections. */
export async function getCollections(): Promise<Collection[]> {
    return tauriInvoke<Collection[]>("get_collections");
}

/** Fetch a single collection by ID. */
export async function getCollection(id: number): Promise<Collection> {
    return tauriInvoke<Collection>("get_collection", { id });
}

/** Create a new collection. */
export async function createCollection(
    dto: CreateCollectionDto,
): Promise<Collection> {
    return tauriInvoke<Collection>("create_collection", { dto });
}

/** Update an existing collection. */
export async function updateCollection(
    id: number,
    dto: UpdateCollectionDto,
): Promise<Collection> {
    return tauriInvoke<Collection>("update_collection", { id, dto });
}

/** Delete a collection by ID. */
export async function deleteCollection(id: number): Promise<void> {
    return tauriInvoke<void>("delete_collection", { id });
}
