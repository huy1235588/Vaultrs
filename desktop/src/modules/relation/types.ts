// Relation types - Cross-vault reference types

// Resolved relation data for display
export interface ResolvedRelation {
    entryId: number;
    vaultId: number;
    title: string;
    exists: boolean;
    vaultName?: string;
    coverImagePath?: string;
}

// Entry summary for relation picker
export interface EntryPickerItem {
    id: number;
    vault_id: number;
    title: string;
    subtitle?: string;
    thumbnail?: string;
}

// Reference for batch resolution
export interface RelationRef {
    entry_id: number;
    vault_id: number;
}
