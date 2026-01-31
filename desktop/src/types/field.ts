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
// Key is field ID (string), value depends on field type
export type EntryMetadata = Record<string, string | number | boolean | null>;

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
 */
export function getFieldDisplayValue(
    fieldId: number,
    value: string | number | boolean | null,
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
 */
function formatFieldValue(
    value: string | number | boolean | null,
    field: FieldDefinition
): string {
    if (value === null || value === undefined) return '';

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
    value: string | number | boolean | null,
    field: FieldDefinition
): { isValid: boolean; warning?: string } {
    if (value === null || value === undefined) {
        if (field.required) {
            return { isValid: false, warning: 'Required field is empty' };
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
