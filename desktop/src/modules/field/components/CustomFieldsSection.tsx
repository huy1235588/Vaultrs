// Custom Fields Section - Display custom fields in read-only mode

import type { FieldDefinition, EntryMetadata } from '../types';
import { CustomFieldRenderer } from './CustomFieldRenderer';

interface CustomFieldsSectionProps {
    fields: FieldDefinition[];
    metadata: EntryMetadata | null;
}

export function CustomFieldsSection({
    fields,
    metadata,
}: CustomFieldsSectionProps) {
    if (fields.length === 0) {
        return null;
    }

    // Filter to only show fields that have values
    const fieldsWithValues = fields.filter((field) => {
        const value = metadata?.[field.name];
        return value !== null && value !== undefined && value !== '';
    });

    if (fieldsWithValues.length === 0) {
        return (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                    Custom Fields
                </h4>
                <p className="text-sm text-muted-foreground/50 italic">
                    No custom field values set
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
                Custom Fields
            </h4>
            <div className="grid gap-3">
                {fieldsWithValues.map((field) => (
                    <CustomFieldRenderer
                        key={field.id}
                        field={field}
                        value={metadata?.[field.name] ?? null}
                    />
                ))}
            </div>
        </div>
    );
}
