// Custom Field Input - Edit components for custom field values

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
import type { FieldDefinition } from '../../types';

interface CustomFieldInputProps {
    field: FieldDefinition;
    value: string | number | boolean | null;
    onChange: (value: string | number | boolean | null) => void;
    error?: string;
}

export function CustomFieldInput({
    field,
    value,
    onChange,
    error,
}: CustomFieldInputProps) {
    const renderInput = () => {
        switch (field.field_type) {
            case 'text':
                return (
                    <Input
                        value={value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        placeholder={`Enter ${field.name.toLowerCase()}...`}
                        maxLength={field.options?.maxLength}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'number':
                return (
                    <Input
                        type="number"
                        value={value !== null ? String(value) : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                onChange(null);
                            } else {
                                onChange(parseFloat(val));
                            }
                        }}
                        placeholder={`Enter ${field.name.toLowerCase()}...`}
                        min={field.options?.min}
                        max={field.options?.max}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'url':
                return (
                    <Input
                        type="url"
                        value={value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        placeholder="https://example.com"
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'boolean':
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={value === true}
                            onCheckedChange={(checked) => onChange(checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                            {value === true ? 'Yes' : 'No'}
                        </span>
                    </div>
                );

            case 'select':
                const choices = field.options?.choices || [];
                return (
                    <Select
                        value={value !== null ? String(value) : ''}
                        onValueChange={(val) => onChange(val || null)}
                    >
                        <SelectTrigger
                            className={error ? 'border-destructive' : ''}
                        >
                            <SelectValue
                                placeholder={`Select ${field.name.toLowerCase()}...`}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {choices.map((choice) => (
                                <SelectItem key={choice} value={choice}>
                                    {choice}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            default:
                return (
                    <Input
                        value={value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        className={error ? 'border-destructive' : ''}
                    />
                );
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={`field-${field.id}`} className="flex items-center gap-1">
                {field.name}
                {field.required && (
                    <span className="text-destructive">*</span>
                )}
            </Label>
            {renderInput()}
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
            {field.field_type === 'text' && field.options?.maxLength && (
                <p className="text-xs text-muted-foreground">
                    {(value as string)?.length || 0} / {field.options.maxLength}
                </p>
            )}
        </div>
    );
}
