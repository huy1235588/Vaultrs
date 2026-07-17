/**
 * DeleteAttributeDialog — Modal confirmation for deleting an attribute (custom field).
 */
import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { getFieldTypeMeta } from "./attributeFieldTypes";
import type { Attribute, FieldType } from "@/core/types/common";

interface DeleteAttributeDialogProps {
    attribute: Attribute;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted?: () => void;
}

export function DeleteAttributeDialog({
    attribute,
    open,
    onOpenChange,
    onDeleted,
}: DeleteAttributeDialogProps) {
    const { removeAttribute } = useCollections();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const typeMeta = getFieldTypeMeta(attribute.field_type as FieldType);
    const TypeIcon = typeMeta.icon;

    async function handleDelete() {
        setSubmitting(true);
        setError(null);
        try {
            await removeAttribute(attribute.id);
            onOpenChange(false);
            onDeleted?.();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to delete attribute";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                            <AlertTriangle className="size-4" />
                        </div>
                        <div>
                            <DialogTitle>Delete Custom Field</DialogTitle>
                            <DialogDescription>
                                This removes the field from the collection&rsquo;s schema.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* What's being deleted */}
                <div className="mt-2 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                        <TypeIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {attribute.name}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                            {attribute.key}
                        </p>
                    </div>
                </div>

                <div className="my-2 space-y-1 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <p className="font-semibold">This can&rsquo;t be undone.</p>
                    <p>
                        Every value stored in this field, across all items in this
                        collection, will be permanently deleted.
                    </p>
                </div>

                {error && (
                    <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
                )}

                <DialogFooter className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Deleting…
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
