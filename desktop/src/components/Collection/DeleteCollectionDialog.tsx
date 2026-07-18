/**
 * DeleteCollectionDialog — Confirmation dialog for deleting a collection.
 */
import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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

    const [confirmText, setConfirmText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isConfirmed = confirmText.trim() === collection.name;

    function reset() {
        setConfirmText("");
        setError(null);
    }

    async function handleDelete() {
        if (!isConfirmed || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await removeCollection(collection.id);
            reset();
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
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset();
                onOpenChange(v);
            }}
        >
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="size-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-center">
                        Delete &ldquo;{collection.name}&rdquo;?
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        This permanently removes the collection and every
                        item inside it. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <label
                        htmlFor="delete-confirm"
                        className="text-sm text-muted-foreground"
                    >
                        Type{" "}
                        <span className="font-medium text-foreground">
                            {collection.name}
                        </span>{" "}
                        to confirm.
                    </label>
                    <Input
                        id="delete-confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={collection.name}
                        autoFocus
                        autoComplete="off"
                    />
                </div>

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
                        disabled={!isConfirmed || submitting}
                    >
                        {submitting && (
                            <Loader2 className="size-4 animate-spin" />
                        )}
                        {submitting ? "Deleting..." : "Delete collection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
