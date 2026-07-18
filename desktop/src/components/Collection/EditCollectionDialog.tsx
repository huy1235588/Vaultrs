/**
 * EditCollectionDialog — Modal form for editing an existing collection.
 */
import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import type { Collection } from "@/core/types/common";
import { cn } from "@/lib/utils";
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

interface EditCollectionDialogProps {
    collection: Collection;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ICON_PRESETS = ["📁", "🎬", "📚", "🎮", "🎵", "📷", "🍳", "✈️"];

export function EditCollectionDialog({
    collection,
    open,
    onOpenChange,
}: EditCollectionDialogProps) {
    const { editCollection } = useCollections();

    const [name, setName] = useState(collection.name);
    const [icon, setIcon] = useState(collection.icon ?? "");
    const [description, setDescription] = useState(
        collection.description ?? "",
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync form state when collection changes
    useEffect(() => {
        setName(collection.name);
        setIcon(collection.icon ?? "");
        setDescription(collection.description ?? "");
        setError(null);
    }, [collection]);

    const isValid = name.trim().length > 0;
    const isDirty =
        name.trim() !== collection.name ||
        icon.trim() !== (collection.icon ?? "") ||
        description.trim() !== (collection.description ?? "");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await editCollection(collection.id, {
                name: name.trim(),
                icon: icon.trim() || undefined,
                description: description.trim() || undefined,
            });
            onOpenChange(false);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to update collection";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Pencil className="size-5 text-primary" />
                        </div>
                        <DialogTitle>Edit collection</DialogTitle>
                        <DialogDescription>
                            Update the details of &ldquo;{collection.name}
                            &rdquo;.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label
                                htmlFor="edit-name"
                                className="text-sm font-medium text-foreground"
                            >
                                Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Icon */}
                        <div className="space-y-2">
                            <label
                                htmlFor="edit-icon"
                                className="text-sm font-medium text-foreground"
                            >
                                Icon{" "}
                                <span className="text-muted-foreground font-normal">
                                    (emoji)
                                </span>
                            </label>
                            <div className="flex items-start gap-2">
                                <Input
                                    id="edit-icon"
                                    placeholder="🎬"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-14 shrink-0 text-center text-base"
                                    maxLength={4}
                                />
                                <div className="flex flex-1 flex-wrap gap-1 pt-0.5">
                                    {ICON_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setIcon(preset)}
                                            aria-label={`Use ${preset} as icon`}
                                            aria-pressed={icon === preset}
                                            className={cn(
                                                "flex size-8 items-center justify-center rounded-md text-base transition-colors hover:bg-muted",
                                                icon === preset &&
                                                    "bg-muted ring-1 ring-ring",
                                            )}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Live preview */}
                        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-base shadow-sm">
                                {icon || "📁"}
                            </span>
                            <span className="truncate text-sm font-medium text-foreground">
                                {name.trim() || "Untitled collection"}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label
                                htmlFor="edit-description"
                                className="text-sm font-medium text-foreground"
                            >
                                Description
                            </label>
                            <textarea
                                id="edit-description"
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
                            disabled={!isValid || !isDirty || submitting}
                        >
                            {submitting && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            {submitting ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
