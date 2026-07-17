/**
 * AttributeManager — Dialog interface for managing custom fields (attributes) of a collection.
 * Shows a list of existing fields, and allows creating, editing, reordering, and deleting them.
 */
import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, Search, Settings, Trash2 } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreateAttributeDialog } from "./CreateAttributeDialog";
import { EditAttributeDialog } from "./EditAttributeDialog";
import { DeleteAttributeDialog } from "./DeleteAttributeDialog";
import { getFieldTypeMeta } from "./attributeFieldTypes";
import type { Attribute, FieldType } from "@/core/types/common";

interface AttributeManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AttributeManager({ open, onOpenChange }: AttributeManagerProps) {
    const { selectedCollection, attributes, attributesLoading, editAttribute } =
        useCollections();

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Attribute | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);

    if (!selectedCollection) return null;

    // Handle moving an attribute up or down to reorder
    async function handleMove(index: number, direction: "up" | "down") {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= attributes.length) return;

        const currentAttr = attributes[index];
        const targetAttr = attributes[targetIndex];

        // Assign/swap display orders
        const currentOrder = index;
        const targetOrder = targetIndex;

        try {
            // Update display orders in backend
            await editAttribute(currentAttr.id, { display_order: targetOrder });
            await editAttribute(targetAttr.id, { display_order: currentOrder });
        } catch (err) {
            console.error("Failed to reorder attributes:", err);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Settings className="size-4" />
                        </div>
                        <div>
                            <DialogTitle>Manage Custom Fields</DialogTitle>
                            <DialogDescription>
                                Define the schema for collection &ldquo;{selectedCollection.name}&rdquo;.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex items-center justify-between border-y bg-muted/30 px-6 py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Active Fields ({attributes.length})
                    </span>
                    <Button size="xs" className="h-8 gap-1" onClick={() => setCreateOpen(true)}>
                        <Plus className="size-3.5" />
                        Add Field
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {attributesLoading && attributes.length === 0 ? (
                        <div className="space-y-2 py-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                            ))}
                        </div>
                    ) : attributes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="size-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">No custom fields yet</p>
                                <p className="max-w-xs text-xs text-muted-foreground">
                                    Add fields to capture structured data like dates, ratings, links, or tags.
                                </p>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                                <Plus className="size-3.5" />
                                Add Field
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y overflow-hidden rounded-lg border bg-card">
                            {attributes.map((attr, idx) => {
                                const typeMeta = getFieldTypeMeta(attr.field_type as FieldType);
                                const TypeIcon = typeMeta.icon;
                                return (
                                    <div
                                        key={attr.id}
                                        className="flex items-center justify-between gap-4 p-3.5 transition-colors hover:bg-accent/30"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                                                <TypeIcon className="size-4" />
                                            </div>
                                            <div className="flex min-w-0 flex-col gap-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate text-sm font-semibold text-foreground">
                                                        {attr.name}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="px-1.5 py-0 font-mono text-[10px] uppercase"
                                                    >
                                                        {attr.field_type}
                                                    </Badge>
                                                    {attr.required === 1 && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="px-1.5 py-0 text-[10px]"
                                                        >
                                                            Required
                                                        </Badge>
                                                    )}
                                                    {attr.searchable === 1 && (
                                                        <span title="Searchable">
                                                            <Search
                                                                className="size-3 text-muted-foreground"
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="truncate font-mono text-xs text-muted-foreground">
                                                    key: {attr.key}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            {/* Reordering */}
                                            <div className="flex items-center overflow-hidden rounded-md border">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className="rounded-none"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMove(idx, "up")}
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="size-3.5" />
                                                </Button>
                                                <Separator orientation="vertical" className="h-4" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    className="rounded-none"
                                                    disabled={idx === attributes.length - 1}
                                                    onClick={() => handleMove(idx, "down")}
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="size-3.5" />
                                                </Button>
                                            </div>

                                            {/* Edit */}
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => setEditTarget(attr)}
                                                title="Edit Field"
                                            >
                                                <Pencil className="size-3.5" />
                                            </Button>

                                            {/* Delete */}
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteTarget(attr)}
                                                title="Delete Field"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t bg-muted/10 p-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>

            {/* Dialogs */}
            <CreateAttributeDialog
                collectionId={selectedCollection.id}
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {editTarget && (
                <EditAttributeDialog
                    attribute={editTarget}
                    open={!!editTarget}
                    onOpenChange={(v) => !v && setEditTarget(null)}
                />
            )}

            {deleteTarget && (
                <DeleteAttributeDialog
                    attribute={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(v) => !v && setDeleteTarget(null)}
                />
            )}
        </Dialog>
    );
}
