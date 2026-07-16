/**
 * DeleteCollectionDialog — Confirmation dialog for deleting a collection.
 */
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import type { Collection } from "@/core/types/common";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteCollectionDialogProps {
    collection: Collection;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteCollectionDialog({
    collection,
    open,
    onOpenChange,
}: DeleteCollectionDialogProps) {
    const { removeCollection } = useCollections();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await removeCollection(collection.id);
            onOpenChange(false);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to delete collection";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="size-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-center">
                        Delete Collection
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Are you sure you want to delete{" "}
                        <strong className="text-foreground">
                            {collection.name}
                        </strong>
                        ? This will permanently remove all items and data in
                        this collection. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {/* Error */}
                {error && (
                    <p className="text-center text-sm text-destructive">
                        {error}
                    </p>
                )}

                <DialogFooter className="mt-2 sm:justify-center">
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
                        {submitting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
