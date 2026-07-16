/**
 * Attribute API service — Tauri IPC wrappers for custom field commands.
 */
import { tauriInvoke } from "./tauri";
import type { Attribute, FieldType } from "@/core/types/common";

// --- DTOs ---

export interface CreateAttributeDto {
    collection_id: number;
    name: string;
    key: string;
    field_type: FieldType;
    options?: Record<string, unknown>;
    display_order?: number;
    required?: boolean;
    searchable?: boolean;
}

export interface UpdateAttributeDto {
    name?: string;
    field_type?: FieldType;
    options?: Record<string, unknown>;
    display_order?: number;
    required?: boolean;
    searchable?: boolean;
}

// --- API Calls ---

/** Fetch all attributes for a collection. */
export async function getAttributes(
    collectionId: number,
): Promise<Attribute[]> {
    return tauriInvoke<Attribute[]>("get_attributes", {
        collectionId,
    });
}

/** Create a new attribute. */
export async function createAttribute(
    dto: CreateAttributeDto,
): Promise<Attribute> {
    return tauriInvoke<Attribute>("create_attribute", { dto });
}

/** Update an existing attribute. */
export async function updateAttribute(
    id: number,
    dto: UpdateAttributeDto,
): Promise<Attribute> {
    return tauriInvoke<Attribute>("update_attribute", { id, dto });
}

/** Delete an attribute by ID. */
export async function deleteAttribute(id: number): Promise<void> {
    return tauriInvoke<void>("delete_attribute", { id });
}
