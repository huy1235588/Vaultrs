/**
 * CreateCollectionDialog — Modal form for creating a new collection.
 */
import { useState } from "react";
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

interface CreateCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Generate a URL-safe slug from a string. */
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export function CreateCollectionDialog({
    open,
    onOpenChange,
}: CreateCollectionDialogProps) {
    const { addCollection } = useCollections();

    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const slug = toSlug(name);
    const isValid = name.trim().length > 0;

    function reset() {
        setName("");
        setIcon("");
        setDescription("");
        setError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await addCollection({
                name: name.trim(),
                slug: slug || undefined,
                icon: icon.trim() || undefined,
                description: description.trim() || undefined,
            });
            reset();
            onOpenChange(false);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to create collection";
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
                        <DialogTitle>New Collection</DialogTitle>
                        <DialogDescription>
                            Create a collection to start organizing your data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label
                                htmlFor="create-name"
                                className="text-sm font-medium text-foreground"
                            >
                                Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="create-name"
                                placeholder="e.g. Films, Books, Games..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                            {slug && (
                                <p className="text-xs text-muted-foreground">
                                    Slug:{" "}
                                    <code className="rounded bg-muted px-1 py-0.5">
                                        {slug}
                                    </code>
                                </p>
                            )}
                        </div>

                        {/* Icon */}
                        <div className="space-y-2">
                            <label
                                htmlFor="create-icon"
                                className="text-sm font-medium text-foreground"
                            >
                                Icon{" "}
                                <span className="text-muted-foreground font-normal">
                                    (emoji)
                                </span>
                            </label>
                            <Input
                                id="create-icon"
                                placeholder="🎬"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-20"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label
                                htmlFor="create-description"
                                className="text-sm font-medium text-foreground"
                            >
                                Description
                            </label>
                            <textarea
                                id="create-description"
                                placeholder="Optional description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
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
