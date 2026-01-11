// Field definition types matching Rust models

export type FieldType = 'text' | 'number' | 'date' | 'url' | 'boolean' | 'select';

export interface FieldOptions {
    maxLength?: number;
    min?: number;
    max?: number;
    choices?: string[];
}

export interface FieldDefinition {
    id: number;
    vault_id: number;
    name: string;
    field_type: FieldType;
    options: FieldOptions | null;
    position: number;
    required: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateFieldParams {
    vault_id: number;
    name: string;
    field_type: FieldType;
    options?: FieldOptions | null;
    required?: boolean;
}

export interface UpdateFieldParams {
    name?: string | null;
    options?: FieldOptions | null;
    required?: boolean | null;
}

// Entry metadata type - dynamic based on field definitions
export type EntryMetadata = Record<string, string | number | boolean | null>;
