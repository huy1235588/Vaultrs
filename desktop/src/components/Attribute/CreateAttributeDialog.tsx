/**
 * CreateAttributeDialog — Modal form for creating a new attribute (custom field) in a collection.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useCollections } from "@/core/context/CollectionContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OptionsTagInput } from "./OptionsTagInput";
import { FIELD_TYPES, getFieldTypeMeta, isChoiceFieldType } from "./attributeFieldTypes";
import type { FieldType } from "@/core/types/common";
import { AlertCircle, Asterisk, Loader2, Plus, Search, SlidersHorizontal } from "lucide-react";

interface CreateAttributeDialogProps {
    collectionId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

export function CreateAttributeDialog({
    collectionId,
    open,
    onOpenChange,
    onCreated,
}: CreateAttributeDialogProps) {
    const { addAttribute } = useCollections();
    const formRef = useRef<HTMLFormElement>(null);

    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [keyEditedManually, setKeyEditedManually] = useState(false);
    const [fieldType, setFieldType] = useState<FieldType>("text");
    const [options, setOptions] = useState<string[]>([]);
    const [optionDraft, setOptionDraft] = useState("");
    const [required, setRequired] = useState(false);
    const [searchable, setSearchable] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isChoiceType = isChoiceFieldType(fieldType);
    const selectedType = useMemo(() => getFieldTypeMeta(fieldType), [fieldType]);
    const SelectedIcon = selectedType.icon;

    // Auto-generate key from name, unless the user has taken over editing it
    useEffect(() => {
        if (keyEditedManually) return;
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s_-]/g, "") // Remove special characters
            .trim()
            .replace(/[\s_-]+/g, "_"); // Replace spaces/dashes with underscore
        setKey(slug);
    }, [name, keyEditedManually]);

    // Cmd/Ctrl+Enter to submit — standard desktop-app shortcut
    useEffect(() => {
        if (!open) return;
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                formRef.current?.requestSubmit();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    function reset() {
        setName("");
        setKey("");
        setKeyEditedManually(false);
        setFieldType("text");
        setOptions([]);
        setOptionDraft("");
        setRequired(false);
        setSearchable(true);
        setError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim() || !key.trim() || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            let attributeOptions: Record<string, unknown> | undefined = undefined;
            if (isChoiceType) {
                // include any option still sitting in the draft input (e.g. submitted via shortcut)
                const pending = optionDraft.trim();
                const choices = pending && !options.includes(pending) ? [...options, pending] : options;
                if (choices.length === 0) {
                    throw new Error("Please add at least one option for this selection list");
                }
                attributeOptions = { choices };
            }

            await addAttribute({
                collection_id: collectionId,
                name: name.trim(),
                key: key.trim(),
                field_type: fieldType,
                options: attributeOptions,
                required,
                searchable,
            });

            reset();
            onOpenChange(false);
            onCreated?.();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create attribute";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset();
                onOpenChange(v);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <form ref={formRef} onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <SlidersHorizontal className="size-4" />
                            </div>
                            <div>
                                <DialogTitle>Add Custom Field</DialogTitle>
                                <DialogDescription>
                                    Create a new custom property for items in this collection.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="mt-5 space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="attr-name">
                                Field Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="attr-name"
                                placeholder="e.g. Release Date, Director, Score"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Key + Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="attr-key">Database Key</Label>
                                <Input
                                    id="attr-key"
                                    placeholder="release_date"
                                    value={key}
                                    onChange={(e) => {
                                        setKeyEditedManually(true);
                                        setKey(e.target.value);
                                    }}
                                    required
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Auto-generated, editable
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="attr-type">Field Type</Label>
                                <Select
                                    value={fieldType}
                                    onValueChange={(val) => setFieldType(val as FieldType)}
                                >
                                    <SelectTrigger id="attr-type">
                                        <SelectValue placeholder="Select type">
                                            <span className="flex items-center gap-2">
                                                <SelectedIcon className="h-4 w-4 text-muted-foreground" />
                                                {selectedType.label}
                                            </span>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2.5">
                                                    <type.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium leading-tight">
                                                            {type.label}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {type.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Options for Select/Multiselect */}
                        {isChoiceType && (
                            <div className="space-y-1.5">
                                <Label htmlFor="attr-options">Options</Label>
                                <OptionsTagInput
                                    id="attr-options"
                                    options={options}
                                    draft={optionDraft}
                                    onOptionsChange={setOptions}
                                    onDraftChange={setOptionDraft}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Press Enter or comma to add each option.
                                </p>
                            </div>
                        )}

                        {/* Field settings */}
                        <div className="divide-y overflow-hidden rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-3 p-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                                    <Asterisk className="size-4" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="attr-required" className="cursor-pointer text-sm font-normal">
                                        Required field
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Items must provide a value for this field.
                                    </p>
                                </div>
                                <Switch
                                    id="attr-required"
                                    checked={required}
                                    onCheckedChange={setRequired}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                                    <Search className="size-4" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="attr-searchable" className="cursor-pointer text-sm font-normal">
                                        Searchable
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Index this field for full-text search.
                                    </p>
                                </div>
                                <Switch
                                    id="attr-searchable"
                                    checked={searchable}
                                    onCheckedChange={setSearchable}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || !key.trim() || submitting}
                            title="Add Field (⌘/Ctrl + Enter)"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Adding…
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Field
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
