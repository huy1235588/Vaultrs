// Field definition types matching Rust models

export type FieldType = 'text' | 'number' | 'date' | 'url' | 'boolean' | 'select' | 'relation';

export interface FieldOptions {
    maxLength?: number;
    min?: number;
    max?: number;
    choices?: string[];
    // Relation field options
    targetVaultId?: number;
    displayFields?: string[];
}

// Value stored in metadata for relation fields
export interface RelationValue {
    entry_id: number;
    vault_id: number;
}

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
// Key is field ID (string), value depends on field type
// For relation fields, value is a RelationValue object
export type EntryMetadataValue = string | number | boolean | RelationValue | null;
export type EntryMetadata = Record<string, EntryMetadataValue>;

/**
 * Type guard to check if a value is a RelationValue
 */
export function isRelationValue(value: EntryMetadataValue): value is RelationValue {
    return (
        value !== null &&
        typeof value === 'object' &&
        'entry_id' in value &&
        'vault_id' in value
    );
}

/**
 * Creates a Map of field ID to field definition for O(1) lookup.
 * Use this when rendering entries to efficiently map metadata keys to field names.
 */
export function createFieldMap(
    fields: FieldDefinition[]
): Map<number, FieldDefinition> {
    return new Map(fields.map((f) => [f.id, f]));
}

/**
 * Gets the display value for a metadata field.
 * Returns the field name and formatted value.
 * Note: For relation fields, use the RelationFieldDisplay component instead.
 */
export function getFieldDisplayValue(
    fieldId: number,
    value: EntryMetadataValue,
    fieldMap: Map<number, FieldDefinition>
): { name: string; value: string; isValid: boolean; warning?: string } {
    const field = fieldMap.get(fieldId);

    if (!field) {
        return {
            name: `Unknown (${fieldId})`,
            value: String(value ?? ''),
            isValid: false,
            warning: 'Field no longer exists',
        };
    }

    // For relation fields, return a placeholder - use RelationFieldDisplay component
    if (field.field_type === 'relation') {
        if (isRelationValue(value)) {
            return {
                name: field.name,
                value: `[Relation: Entry ${value.entry_id}]`,
                isValid: true,
            };
        }
        return {
            name: field.name,
            value: '',
            isValid: true,
        };
    }

    const formattedValue = formatFieldValue(value, field);
    const validation = validateFieldValue(value, field);

    return {
        name: field.name,
        value: formattedValue,
        isValid: validation.isValid,
        warning: validation.warning,
    };
}

/**
 * Formats a field value for display based on field type.
 * Note: Relation fields should be handled separately.
 */
function formatFieldValue(
    value: EntryMetadataValue,
    field: FieldDefinition
): string {
    if (value === null || value === undefined) return '';

    // Relations are handled by RelationFieldDisplay
    if (isRelationValue(value)) return '';

    switch (field.field_type) {
        case 'boolean':
            return value ? 'Yes' : 'No';
        case 'date':
            // Format date for display
            return String(value);
        case 'url':
            return String(value);
        default:
            return String(value);
    }
}

/**
 * Validates a field value against its type and options.
 * Used for displaying warnings in the UI.
 */
function validateFieldValue(
    value: EntryMetadataValue,
    field: FieldDefinition
): { isValid: boolean; warning?: string } {
    if (value === null || value === undefined) {
        if (field.required) {
            return { isValid: false, warning: 'Required field is empty' };
        }
        return { isValid: true };
    }

    // Relations are validated differently
    if (field.field_type === 'relation') {
        if (!isRelationValue(value)) {
            return { isValid: false, warning: 'Invalid relation value' };
        }
        return { isValid: true };
    }

    const options = field.options;

    switch (field.field_type) {
        case 'text':
            if (options?.maxLength && String(value).length > options.maxLength) {
                return {
                    isValid: false,
                    warning: `Exceeds max length of ${options.maxLength}`,
                };
            }
            break;

        case 'number':
            const num = Number(value);
            if (isNaN(num)) {
                return { isValid: false, warning: 'Not a valid number' };
            }
            if (options?.min !== undefined && num < options.min) {
                return { isValid: false, warning: `Below minimum ${options.min}` };
            }
            if (options?.max !== undefined && num > options.max) {
                return { isValid: false, warning: `Exceeds maximum ${options.max}` };
            }
            break;

        case 'select':
            if (options?.choices && !options.choices.includes(String(value))) {
                return {
                    isValid: false,
                    warning: `'${value}' is not a valid choice`,
                };
            }
            break;
    }

    return { isValid: true };
}
