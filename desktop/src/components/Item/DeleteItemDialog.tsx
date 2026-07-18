/**
 * DeleteItemDialog — Modal confirmation for deleting an item.
 */
import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as itemService from "@/core/api/itemService";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteItemDialogProps {
    itemId: number;
    itemTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted?: () => void;
}

export function DeleteItemDialog({
    itemId,
    itemTitle,
    open,
    onOpenChange,
    onDeleted,
}: DeleteItemDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleOpenChange(next: boolean) {
        if (!next) setError(null);
        onOpenChange(next);
    }

    async function handleDelete() {
        setSubmitting(true);
        setError(null);
        try {
            await itemService.deleteItem(itemId);
            onOpenChange(false);
            onDeleted?.();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to delete item";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mx-0 sm:size-10">
                        <AlertTriangle className="size-6" />
                    </div>
                    <DialogTitle className="pt-4 text-center sm:text-left">
                        Delete item
                    </DialogTitle>
                    <DialogDescription className="text-center sm:text-left">
                        This permanently deletes &ldquo;
                        <span className="font-semibold text-foreground">
                            {itemTitle}
                        </span>
                        &rdquo; and all of its custom field data. This can&apos;t be undone.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <p className="text-sm font-medium text-destructive mt-2">{error}</p>
                )}

                <DialogFooter className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={submitting}
                        className="gap-1.5 min-w-[110px]"
                    >
                        {submitting && <Loader2 className="size-3.5 animate-spin" />}
                        {submitting ? "Deleting..." : "Delete item"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
