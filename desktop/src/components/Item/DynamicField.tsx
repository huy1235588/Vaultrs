/**
 * DynamicField — Component for rendering and editing a single custom field value based on its type.
 */
import { useEffect, useState } from "react";
import { Link, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Attribute, FieldType } from "@/core/types/common";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DynamicFieldProps {
    attribute: Attribute;
    value: any;
    onChange: (value: any) => void;
    className?: string;
}

export function DynamicField({ attribute, value, onChange, className }: DynamicFieldProps) {
    const [choices, setChoices] = useState<string[]>([]);

    useEffect(() => {
        if (attribute.options) {
            try {
                const parsed = JSON.parse(attribute.options);
                if (parsed && Array.isArray(parsed.choices)) {
                    setChoices(parsed.choices);
                }
            } catch (e) {
                console.error("Failed to parse options for", attribute.key, e);
            }
        }
    }, [attribute]);

    // Handle multiselect toggle
    const handleMultiToggle = (choice: string) => {
        const currentArr = Array.isArray(value) ? value : [];
        let newArr: string[];
        if (currentArr.includes(choice)) {
            newArr = currentArr.filter((c) => c !== choice);
        } else {
            newArr = [...currentArr, choice];
        }
        onChange(newArr);
    };

    const renderInput = () => {
        const type = attribute.field_type as FieldType;

        switch (type) {
            case "text":
                return (
                    <Input
                        type="text"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`Enter ${attribute.name.toLowerCase()}...`}
                        className="bg-background/50"
                    />
                );

            case "textarea":
                return (
                    <Textarea
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`Enter detailed ${attribute.name.toLowerCase()}...`}
                        className="bg-background/50 min-h-[80px] resize-y"
                    />
                );

            case "number":
                return (
                    <Input
                        type="number"
                        step={1}
                        value={value ?? ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange(val === "" ? null : parseInt(val, 10));
                        }}
                        placeholder="0"
                        className="bg-background/50"
                    />
                );

            case "decimal":
                return (
                    <Input
                        type="number"
                        step="any"
                        value={value ?? ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange(val === "" ? null : parseFloat(val));
                        }}
                        placeholder="0.00"
                        className="bg-background/50"
                    />
                );

            case "date":
                return (
                    <Input
                        type="date"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value || null)}
                        className="bg-background/50"
                    />
                );

            case "datetime":
                return (
                    <Input
                        type="datetime-local"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value || null)}
                        className="bg-background/50"
                    />
                );

            case "checkbox":
                return (
                    <div className="flex items-center h-9">
                        <Switch
                            id={`switch-${attribute.id}`}
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(checked)}
                        />
                        <Label
                            htmlFor={`switch-${attribute.id}`}
                            className="ml-2.5 text-xs text-muted-foreground cursor-pointer"
                        >
                            {value ? "Enabled / Yes" : "Disabled / No"}
                        </Label>
                    </div>
                );

            case "select":
                return (
                    <Select
                        value={value ?? ""}
                        onValueChange={(val) => onChange(val || null)}
                    >
                        <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
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

            case "multiselect":
                const selectedList = Array.isArray(value) ? value : [];
                return (
                    <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background/30 min-h-9">
                        {choices.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic px-1">
                                No options defined
                            </span>
                        ) : (
                            choices.map((choice) => {
                                const isSelected = selectedList.includes(choice);
                                return (
                                    <button
                                        type="button"
                                        key={choice}
                                        onClick={() => handleMultiToggle(choice)}
                                        className="transition-all focus:outline-none"
                                    >
                                        <Badge
                                            variant={isSelected ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer select-none text-xs px-2.5 py-0.5",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground hover:bg-primary/95"
                                                    : "bg-background/30 hover:bg-accent hover:text-foreground text-muted-foreground"
                                            )}
                                        >
                                            {choice}
                                        </Badge>
                                    </button>
                                );
                            })
                        )}
                    </div>
                );

            case "url":
                const isValidUrl =
                    typeof value === "string" &&
                    (value.startsWith("http://") || value.startsWith("https://"));
                return (
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                type="url"
                                value={value ?? ""}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder="https://example.com"
                                className="pl-8 bg-background/50"
                            />
                        </div>
                        {isValidUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={() => window.open(value, "_blank")}
                                title="Open URL in Browser"
                            >
                                <ExternalLink className="size-4" />
                            </Button>
                        )}
                    </div>
                );

            default:
                return (
                    <Input
                        type="text"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`Enter ${attribute.name}...`}
                        className="bg-background/50"
                    />
                );
        }
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {attribute.name}
                    {attribute.required === 1 && (
                        <span className="text-destructive ml-1">*</span>
                    )}
                </Label>
            </div>
            {renderInput()}
        </div>
    );
}
