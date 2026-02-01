// Create Field Dialog - Form for creating a new field definition

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, X } from 'lucide-react';
import { useFieldStore } from '../store';
import { vaultApi, type Vault } from '@/modules/vault';
import type { FieldType, FieldOptions } from '../types';

interface CreateFieldDialogProps {
    vaultId: number;
    isOpen: boolean;
    onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string; description?: string }[] = [
    { value: 'text', label: 'Text', description: 'Single or multi-line text' },
    { value: 'number', label: 'Number', description: 'Integer or decimal' },
    { value: 'date', label: 'Date', description: 'Date picker' },
    { value: 'url', label: 'URL', description: 'Web link' },
    { value: 'boolean', label: 'Yes/No', description: 'Toggle switch' },
    { value: 'select', label: 'Dropdown', description: 'Pick from options' },
    { value: 'relation', label: 'Relation', description: 'Link to another vault' },
];

export function CreateFieldDialog({
    vaultId,
    isOpen,
    onClose,
}: CreateFieldDialogProps) {
    const { createField } = useFieldStore();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [fieldType, setFieldType] = useState<FieldType>('text');
    const [required, setRequired] = useState(false);
    const [maxLength, setMaxLength] = useState<string>('');
    const [min, setMin] = useState<string>('');
    const [max, setMax] = useState<string>('');
    const [choices, setChoices] = useState<string[]>(['']);
    
    // Relation-specific state
    const [targetVaultId, setTargetVaultId] = useState<string>('');
    const [availableVaults, setAvailableVaults] = useState<Vault[]>([]);
    const [isLoadingVaults, setIsLoadingVaults] = useState(false);

    // Load available vaults when relation type is selected
    useEffect(() => {
        if (fieldType === 'relation' && isOpen) {
            setIsLoadingVaults(true);
            vaultApi.list()
                .then((vaults) => {
                    // Filter out the current vault (can't link to self)
                    setAvailableVaults(vaults.filter((v) => v.id !== vaultId));
                })
                .catch((err) => {
                    console.error('Failed to load vaults:', err);
                    setAvailableVaults([]);
                })
                .finally(() => setIsLoadingVaults(false));
        }
    }, [fieldType, isOpen, vaultId]);

    const resetForm = () => {
        setName('');
        setFieldType('text');
        setRequired(false);
        setMaxLength('');
        setMin('');
        setMax('');
        setChoices(['']);
        setTargetVaultId('');
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

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

            if (fieldType === 'text' && maxLength) {
                options.maxLength = parseInt(maxLength, 10);
            }

            if (fieldType === 'number') {
                if (min) options.min = parseFloat(min);
                if (max) options.max = parseFloat(max);
            }

            if (fieldType === 'select') {
                const validChoices = choices.filter((c) => c.trim());
                if (validChoices.length === 0) {
                    setError('At least one choice is required for dropdown fields');
                    setIsSaving(false);
                    return;
                }
                options.choices = validChoices;
            }

            if (fieldType === 'relation') {
                if (!targetVaultId) {
                    setError('Please select a target vault for the relation field');
                    setIsSaving(false);
                    return;
                }
                options.targetVaultId = parseInt(targetVaultId, 10);
            }

            await createField({
                vault_id: vaultId,
                name: name.trim(),
                field_type: fieldType,
                options: Object.keys(options).length > 0 ? options : undefined,
                required,
            });

            handleClose();
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Custom Field</DialogTitle>
                    <DialogDescription>
                        Create a new field that will appear on entries in this vault.
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
                        <Label htmlFor="fieldName">Field Name *</Label>
                        <Input
                            id="fieldName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Director, Year, Rating"
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label>Field Type *</Label>
                        <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Required toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="required">Required</Label>
                            <p className="text-xs text-muted-foreground">
                                Entry cannot be saved without this field
                            </p>
                        </div>
                        <Switch
                            id="required"
                            checked={required}
                            onCheckedChange={setRequired}
                        />
                    </div>

                    {/* Type-specific options */}
                    {fieldType === 'text' && (
                        <div className="space-y-2">
                            <Label htmlFor="maxLength">Maximum Length (optional)</Label>
                            <Input
                                id="maxLength"
                                type="number"
                                value={maxLength}
                                onChange={(e) => setMaxLength(e.target.value)}
                                placeholder="No limit"
                                min={1}
                            />
                        </div>
                    )}

                    {fieldType === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min">Minimum (optional)</Label>
                                <Input
                                    id="min"
                                    type="number"
                                    value={min}
                                    onChange={(e) => setMin(e.target.value)}
                                    placeholder="No minimum"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max">Maximum (optional)</Label>
                                <Input
                                    id="max"
                                    type="number"
                                    value={max}
                                    onChange={(e) => setMax(e.target.value)}
                                    placeholder="No maximum"
                                />
                            </div>
                        </div>
                    )}

                    {fieldType === 'select' && (
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

                    {fieldType === 'relation' && (
                        <div className="space-y-2">
                            <Label>Target Vault *</Label>
                            <p className="text-xs text-muted-foreground">
                                Select which vault this field will link to
                            </p>
                            {isLoadingVaults ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading vaults...
                                </div>
                            ) : availableVaults.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    No other vaults available. Create another vault first.
                                </div>
                            ) : (
                                <Select
                                    value={targetVaultId}
                                    onValueChange={setTargetVaultId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a vault..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableVaults.map((vault) => (
                                            <SelectItem key={vault.id} value={String(vault.id)}>
                                                <div className="flex items-center gap-2">
                                                    {vault.icon && <span>{vault.icon}</span>}
                                                    <span>{vault.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                'Create Field'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
