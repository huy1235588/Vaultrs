/**
 * EditAttributeDialog — Modal form for editing an existing attribute (custom field).
 */
import { useEffect, useState, type FormEvent } from "react";
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
import { OptionsTagInput } from "./OptionsTagInput";
import { getFieldTypeMeta, isChoiceFieldType, isReferenceFieldType } from "./attributeFieldTypes";
import type { Attribute, FieldType } from "@/core/types/common";
import { AlertCircle, Asterisk, Loader2, Pencil, Save, Search } from "lucide-react";

interface EditAttributeDialogProps {
    attribute: Attribute;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated?: () => void;
}

export function EditAttributeDialog({
    attribute,
    open,
    onOpenChange,
    onUpdated,
}: EditAttributeDialogProps) {
    const { editAttribute, collections } = useCollections();
    const [name, setName] = useState("");
    const [options, setOptions] = useState<string[]>([]);
    const [optionDraft, setOptionDraft] = useState("");
    const [required, setRequired] = useState(false);
    const [searchable, setSearchable] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSelectOrMulti = isChoiceFieldType(attribute.field_type as FieldType);
    const isReference = isReferenceFieldType(attribute.field_type as FieldType);
    const typeMeta = getFieldTypeMeta(attribute.field_type as FieldType);
    const TypeIcon = typeMeta.icon;

    // Parse target collection for reference type
    const targetCollectionId = (() => {
        if (!isReference || !attribute.options) return null;
        try {
            const parsed = JSON.parse(attribute.options);
            return parsed?.target_collection_id ?? null;
        } catch {
            return null;
        }
    })();
    const targetCollection = targetCollectionId
        ? collections.find((c) => c.id === targetCollectionId)
        : null;

    // Set form fields on attribute change
    useEffect(() => {
        if (!attribute) return;
        setName(attribute.name);
        setRequired(attribute.required === 1);
        setSearchable(attribute.searchable === 1);
        setOptionDraft("");

        if (attribute.options) {
            try {
                const parsed = JSON.parse(attribute.options);
                setOptions(Array.isArray(parsed?.choices) ? parsed.choices : []);
            } catch {
                setOptions([]);
            }
        } else {
            setOptions([]);
        }
    }, [attribute]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim() || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            let attributeOptions: Record<string, unknown> | undefined = undefined;
            if (isSelectOrMulti) {
                // include any option still sitting in the draft input
                const pending = optionDraft.trim();
                const choices = pending && !options.includes(pending) ? [...options, pending] : options;
                if (choices.length === 0) {
                    throw new Error("Please enter at least one option for selection list");
                }
                attributeOptions = { choices };
            }

            await editAttribute(attribute.id, {
                name: name.trim(),
                options: attributeOptions,
                required,
                searchable,
            });

            onOpenChange(false);
            onUpdated?.();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to update attribute";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Pencil className="size-4" />
                            </div>
                            <div>
                                <DialogTitle>Edit Custom Field</DialogTitle>
                                <DialogDescription>
                                    Modify custom field &ldquo;{attribute.name}&rdquo;.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="mt-5 space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-attr-name">Field Name</Label>
                            <Input
                                id="edit-attr-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Readonly info */}
                        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                            <div>
                                <span className="mb-1 block font-semibold text-foreground">Key</span>
                                <code className="font-mono">{attribute.key}</code>
                            </div>
                            <div>
                                <span className="mb-1 block font-semibold text-foreground">Type</span>
                                <span className="flex items-center gap-1.5">
                                    <TypeIcon className="size-3.5" />
                                    {typeMeta.label}
                                </span>
                            </div>
                        </div>

                        {/* Options for Select/Multiselect */}
                        {isSelectOrMulti && (
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-attr-options">Options</Label>
                                <OptionsTagInput
                                    id="edit-attr-options"
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

                        {/* Target Collection (read-only) for Reference type */}
                        {isReference && targetCollection && (
                            <div className="space-y-1.5">
                                <Label>Target Collection</Label>
                                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                                    <span className="text-base leading-none">
                                        {targetCollection.icon || "\uD83D\uDCC1"}
                                    </span>
                                    <span className="font-medium">{targetCollection.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Target collection cannot be changed after creation.
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
                                    <Label htmlFor="edit-attr-required" className="cursor-pointer text-sm font-normal">
                                        Required field
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Items must provide a value for this field.
                                    </p>
                                </div>
                                <Switch
                                    id="edit-attr-required"
                                    checked={required}
                                    onCheckedChange={setRequired}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                                    <Search className="size-4" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="edit-attr-searchable" className="cursor-pointer text-sm font-normal">
                                        Searchable
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Index this field for full-text search.
                                    </p>
                                </div>
                                <Switch
                                    id="edit-attr-searchable"
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
                        <Button type="submit" disabled={!name.trim() || submitting}>
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Saving…
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Save className="h-3.5 w-3.5" />
                                    Save Changes
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
