// Edit Field Dialog - Form for editing a field definition

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, X } from 'lucide-react';
import { useFieldStore } from '../store';
import type { FieldDefinition, FieldOptions } from '../types';

interface EditFieldDialogProps {
    field: FieldDefinition | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EditFieldDialog({
    field,
    isOpen,
    onClose,
}: EditFieldDialogProps) {
    const { updateField } = useFieldStore();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [required, setRequired] = useState(false);
    const [maxLength, setMaxLength] = useState<string>('');
    const [min, setMin] = useState<string>('');
    const [max, setMax] = useState<string>('');
    const [choices, setChoices] = useState<string[]>(['']);

    // Initialize form when field changes
    useEffect(() => {
        if (field) {
            setName(field.name);
            setRequired(field.required);
            setMaxLength(field.options?.maxLength?.toString() || '');
            setMin(field.options?.min?.toString() || '');
            setMax(field.options?.max?.toString() || '');
            setChoices(field.options?.choices || ['']);
            setError(null);
        }
    }, [field]);

    if (!field) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Field name is required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Build options based on field type
            const options: FieldOptions = {};

            if (field.field_type === 'text' && maxLength) {
                options.maxLength = parseInt(maxLength, 10);
            }

            if (field.field_type === 'number') {
                if (min) options.min = parseFloat(min);
                if (max) options.max = parseFloat(max);
            }

            if (field.field_type === 'select') {
                const validChoices = choices.filter((c) => c.trim());
                if (validChoices.length === 0) {
                    setError('At least one choice is required for dropdown fields');
                    setIsSaving(false);
                    return;
                }
                options.choices = validChoices;
            }

            await updateField(field.id, {
                name: name.trim(),
                options: Object.keys(options).length > 0 ? options : undefined,
                required,
            });

            onClose();
        } catch (err) {
            setError(String(err));
        } finally {
            setIsSaving(false);
        }
    };

    const addChoice = () => {
        setChoices([...choices, '']);
    };

    const removeChoice = (index: number) => {
        if (choices.length > 1) {
            setChoices(choices.filter((_, i) => i !== index));
        }
    };

    const updateChoice = (index: number, value: string) => {
        const newChoices = [...choices];
        newChoices[index] = value;
        setChoices(newChoices);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Field</DialogTitle>
                    <DialogDescription>
                        Update the field settings. Field type cannot be changed.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="editFieldName">Field Name *</Label>
                        <Input
                            id="editFieldName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Type (read-only) */}
                    <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Input
                            value={field.field_type.charAt(0).toUpperCase() + field.field_type.slice(1)}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    {/* Required toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="editRequired">Required</Label>
                            <p className="text-xs text-muted-foreground">
                                Entry cannot be saved without this field
                            </p>
                        </div>
                        <Switch
                            id="editRequired"
                            checked={required}
                            onCheckedChange={setRequired}
                        />
                    </div>

                    {/* Type-specific options */}
                    {field.field_type === 'text' && (
                        <div className="space-y-2">
                            <Label htmlFor="editMaxLength">Maximum Length (optional)</Label>
                            <Input
                                id="editMaxLength"
                                type="number"
                                value={maxLength}
                                onChange={(e) => setMaxLength(e.target.value)}
                                placeholder="No limit"
                                min={1}
                            />
                        </div>
                    )}

                    {field.field_type === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editMin">Minimum (optional)</Label>
                                <Input
                                    id="editMin"
                                    type="number"
                                    value={min}
                                    onChange={(e) => setMin(e.target.value)}
                                    placeholder="No minimum"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editMax">Maximum (optional)</Label>
                                <Input
                                    id="editMax"
                                    type="number"
                                    value={max}
                                    onChange={(e) => setMax(e.target.value)}
                                    placeholder="No maximum"
                                />
                            </div>
                        </div>
                    )}

                    {field.field_type === 'select' && (
                        <div className="space-y-2">
                            <Label>Dropdown Options *</Label>
                            <div className="space-y-2">
                                {choices.map((choice, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={choice}
                                            onChange={(e) => updateChoice(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeChoice(index)}
                                            disabled={choices.length <= 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addChoice}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
