/**
 * Item API service — Tauri IPC wrappers for item commands.
 */
import { tauriInvoke } from "./tauri";
import type { Item, PaginatedResponse } from "@/core/types/common";

// --- DTOs ---

export interface CreateItemDto {
    collection_id: number;
    title: string;
    properties?: Record<string, unknown>;
}

export interface UpdateItemDto {
    title?: string;
    properties?: Record<string, unknown>;
}

export interface PaginationParams {
    page?: number;
    page_size?: number;
}

// --- API Calls ---

/** Fetch paginated items for a collection. */
export async function getItems(
    collectionId: number,
    params: PaginationParams = {},
): Promise<PaginatedResponse<Item>> {
    return tauriInvoke<PaginatedResponse<Item>>("get_items", {
        collectionId,
        params,
    });
}

/** Fetch a single item by ID. */
export async function getItem(id: number): Promise<Item> {
    return tauriInvoke<Item>("get_item", { id });
}

/** Create a new item. */
export async function createItem(dto: CreateItemDto): Promise<Item> {
    return tauriInvoke<Item>("create_item", { dto });
}

/** Update an existing item. */
export async function updateItem(
    id: number,
    dto: UpdateItemDto,
): Promise<Item> {
    return tauriInvoke<Item>("update_item", { id, dto });
}

/** Delete an item by ID. */
export async function deleteItem(id: number): Promise<void> {
    return tauriInvoke<void>("delete_item", { id });
}

// --- Cursor-based Pagination (for infinite scroll) ---

export interface CursorParams {
    after_id?: number;
    limit?: number;
}

export interface CursorResponse<T> {
    data: T[];
    has_more: boolean;
    total: number;
}

/** Fetch items using cursor-based pagination (for infinite scroll). */
export async function getItemsCursor(
    collectionId: number,
    params: CursorParams = {},
): Promise<CursorResponse<Item>> {
    return tauriInvoke<CursorResponse<Item>>("get_items_cursor", {
        collectionId,
        params,
    });
}
