/**
 * CreateItemDialog — Modal form for creating a new item in a collection.
 */
import { useState } from "react";
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
import { Input } from "@/components/ui/input";

interface CreateItemDialogProps {
    collectionId: number;
    collectionName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after successful creation so parent can refresh. */
    onCreated?: () => void;
}

export function CreateItemDialog({
    collectionId,
    collectionName,
    open,
    onOpenChange,
    onCreated,
}: CreateItemDialogProps) {
    const [title, setTitle] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = title.trim().length > 0;

    function reset() {
        setTitle("");
        setError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await itemService.createItem({
                collection_id: collectionId,
                title: title.trim(),
            });
            reset();
            onOpenChange(false);
            onCreated?.();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create item";
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
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>New Item</DialogTitle>
                        <DialogDescription>
                            Add a new item to &ldquo;{collectionName}&rdquo;.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <label
                                htmlFor="item-title"
                                className="text-sm font-medium text-foreground"
                            >
                                Title{" "}
                                <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="item-title"
                                placeholder="Enter item title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
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
                            disabled={!isValid || submitting}
                        >
                            {submitting ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
