// Field Definition Row - Display a single field definition with actions

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Pencil,
    Trash2,
    ChevronUp,
    ChevronDown,
    Type,
    Hash,
    Calendar,
    Link,
    ToggleLeft,
    List,
} from 'lucide-react';
import type { FieldDefinition, FieldType } from '../types';

interface FieldDefinitionRowProps {
    field: FieldDefinition;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
}

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
    text: <Type className="h-4 w-4" />,
    number: <Hash className="h-4 w-4" />,
    date: <Calendar className="h-4 w-4" />,
    url: <Link className="h-4 w-4" />,
    boolean: <ToggleLeft className="h-4 w-4" />,
    select: <List className="h-4 w-4" />,
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    url: 'URL',
    boolean: 'Boolean',
    select: 'Select',
};

export function FieldDefinitionRow({
    field,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
}: FieldDefinitionRowProps) {
    return (
        <div className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent transition-colors">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onMoveUp}
                    disabled={!onMoveUp}
                    title="Move up"
                >
                    <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onMoveDown}
                    disabled={!onMoveDown}
                    title="Move down"
                >
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </div>

            {/* Field icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                {FIELD_TYPE_ICONS[field.field_type]}
            </div>

            {/* Field info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{field.name}</span>
                    {field.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{FIELD_TYPE_LABELS[field.field_type]}</span>
                    {field.field_type === 'select' && field.options?.choices && (
                        <span>• {field.options.choices.length} options</span>
                    )}
                    {field.field_type === 'text' && field.options?.maxLength && (
                        <span>• Max {field.options.maxLength} chars</span>
                    )}
                    {field.field_type === 'number' && (field.options?.min !== undefined || field.options?.max !== undefined) && (
                        <span>
                            • {field.options.min !== undefined && `Min ${field.options.min}`}
                            {field.options.min !== undefined && field.options.max !== undefined && ' - '}
                            {field.options.max !== undefined && `Max ${field.options.max}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onEdit}
                    title="Edit field"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                    title="Delete field"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
