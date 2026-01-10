// Custom Field Renderer - Read-only display of custom field values

import { ExternalLink, Calendar, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FieldDefinition } from '../../types';

interface CustomFieldRendererProps {
    field: FieldDefinition;
    value: string | number | boolean | null;
}

export function CustomFieldRenderer({ field, value }: CustomFieldRendererProps) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const renderValue = () => {
        switch (field.field_type) {
            case 'text':
                return (
                    <span className="text-sm">{String(value)}</span>
                );

            case 'number':
                return (
                    <span className="text-sm font-mono">
                        {typeof value === 'number'
                            ? value.toLocaleString()
                            : value}
                    </span>
                );

            case 'date':
                try {
                    const date = new Date(String(value));
                    return (
                        <span className="text-sm flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {date.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    );
                } catch {
                    return <span className="text-sm">{String(value)}</span>;
                }

            case 'url':
                return (
                    <a
                        href={String(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1.5 max-w-full"
                    >
                        <span className="truncate">{String(value)}</span>
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    </a>
                );

            case 'boolean':
                return value ? (
                    <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Yes
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="gap-1">
                        <X className="h-3 w-3" />
                        No
                    </Badge>
                );

            case 'select':
                return (
                    <Badge variant="outline">{String(value)}</Badge>
                );

            default:
                return <span className="text-sm">{String(value)}</span>;
        }
    };

    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
            <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
                {field.name}
                {field.required && (
                    <span className="text-destructive ml-0.5">*</span>
                )}
            </span>
            <div className="flex-1 min-w-0">{renderValue()}</div>
        </div>
    );
}
