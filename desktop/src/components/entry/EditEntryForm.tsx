// Edit Entry Form - Form for editing entry with custom fields

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import type { Entry, FieldDefinition, EntryMetadata } from '../../types';
import { useEntryStore } from '../../stores';
import { CustomFieldInput } from '../field/CustomFieldInput';
import { CoverImageDisplay, CoverImageUploader } from './';

interface EditEntryFormProps {
    entry: Entry;
    fields: FieldDefinition[];
    onSaveComplete: () => void;
    onCancel: () => void;
}

export function EditEntryForm({
    entry,
    fields,
    onSaveComplete,
    onCancel,
}: EditEntryFormProps) {
    const { updateEntry } = useEntryStore();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Parse existing metadata
    const existingMetadata: EntryMetadata = entry.metadata
        ? (() => {
            try {
                return JSON.parse(entry.metadata);
            } catch {
                return {};
            }
        })()
        : {};

    // Form state
    const [title, setTitle] = useState(entry.title);
    const [description, setDescription] = useState(entry.description || '');
    const [metadata, setMetadata] = useState<EntryMetadata>(existingMetadata);

    // Validation
    const [titleError, setTitleError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        let isValid = true;
        const newFieldErrors: Record<string, string> = {};

        // Validate title
        if (!title.trim()) {
            setTitleError('Title is required');
            isValid = false;
        } else {
            setTitleError(null);
        }

        // Validate required custom fields
        for (const field of fields) {
            if (field.required) {
                const value = metadata[field.name];
                if (value === null || value === undefined || value === '') {
                    newFieldErrors[field.name] = `${field.name} is required`;
                    isValid = false;
                }
            }

            // Type-specific validation
            const value = metadata[field.name];
            if (value !== null && value !== undefined && value !== '') {
                switch (field.field_type) {
                    case 'url':
                        if (
                            typeof value === 'string' &&
                            !isValidUrl(value)
                        ) {
                            newFieldErrors[field.name] = 'Invalid URL format';
                            isValid = false;
                        }
                        break;
                    case 'number':
                        if (typeof value !== 'number' && isNaN(Number(value))) {
                            newFieldErrors[field.name] = 'Must be a number';
                            isValid = false;
                        }
                        if (field.options?.min !== undefined && Number(value) < field.options.min) {
                            newFieldErrors[field.name] = `Minimum value is ${field.options.min}`;
                            isValid = false;
                        }
                        if (field.options?.max !== undefined && Number(value) > field.options.max) {
                            newFieldErrors[field.name] = `Maximum value is ${field.options.max}`;
                            isValid = false;
                        }
                        break;
                    case 'text':
                        if (
                            field.options?.maxLength &&
                            typeof value === 'string' &&
                            value.length > field.options.maxLength
                        ) {
                            newFieldErrors[field.name] = `Maximum ${field.options.maxLength} characters`;
                            isValid = false;
                        }
                        break;
                }
            }
        }

        setFieldErrors(newFieldErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updateEntry(entry.id, {
                title: title.trim(),
                description: description.trim() || null,
                metadata: JSON.stringify(metadata),
            });
            onSaveComplete();
        } catch (err) {
            setError(String(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (fieldName: string, value: string | number | boolean | null) => {
        setMetadata((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
        // Clear error when user types
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[fieldName];
                return next;
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Error message */}
            {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (titleError) setTitleError(null);
                    }}
                    placeholder="Entry title"
                    className={titleError ? 'border-destructive' : ''}
                />
                {titleError && (
                    <p className="text-xs text-destructive">{titleError}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={3}
                />
            </div>

            {/* Cover Image */}
            <div className="space-y-4">
                <Label>Cover Image</Label>
                <CoverImageDisplay entry={entry} showRemoveButton={true} />
                <CoverImageUploader 
                    entryId={entry.id}
                    onSuccess={() => {
                        // Refresh entry data after upload
                        window.location.reload();
                    }}
                />
            </div>

            {/* Custom Fields */}
            {fields.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Custom Fields
                    </h4>
                    <div className="space-y-4">
                        {fields.map((field) => (
                            <CustomFieldInput
                                key={field.id}
                                field={field}
                                value={metadata[field.name] ?? null}
                                onChange={(value: string | number | boolean | null) =>
                                    handleFieldChange(field.name, value)
                                }
                                error={fieldErrors[field.name]}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

// Helper function
function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}
