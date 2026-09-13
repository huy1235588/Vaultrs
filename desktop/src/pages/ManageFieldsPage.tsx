/**
 * ManageFieldsPage — Dedicated page for managing custom fields (attributes) of a collection.
 *
 * Supports creating, editing, reordering, searching, and deleting schema fields.
 */
import { useMemo, useState } from "react";
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Check,
    FileText,
    Pencil,
    Plus,
    Search,
    Sliders,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateAttributeDialog } from "@/components/Attribute/CreateAttributeDialog";
import { EditAttributeDialog } from "@/components/Attribute/EditAttributeDialog";
import { DeleteAttributeDialog } from "@/components/Attribute/DeleteAttributeDialog";
import { getFieldTypeMeta } from "@/components/Attribute/attributeFieldTypes";
import type { Attribute, FieldType } from "@/core/types/common";

export function ManageFieldsPage() {
    const { selectedCollection, attributes, attributesLoading, editAttribute, setActiveSubView } =
        useCollections();

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Attribute | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    if (!selectedCollection) return null;

    // Filter attributes by search query
    const filteredAttributes = useMemo(() => {
        if (!searchQuery.trim()) return attributes;
        const q = searchQuery.toLowerCase();
        return attributes.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.key.toLowerCase().includes(q) ||
                a.field_type.toLowerCase().includes(q),
        );
    }, [attributes, searchQuery]);

    // Handle reordering attributes
    async function handleMove(index: number, direction: "up" | "down") {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= attributes.length) return;

        const currentAttr = attributes[index];
        const targetAttr = attributes[targetIndex];

        try {
            await editAttribute(currentAttr.id, { display_order: targetIndex });
            await editAttribute(targetAttr.id, { display_order: index });
        } catch (err) {
            console.error("Failed to reorder attributes:", err);
        }
    }

    return (
        <div className="flex h-full flex-col animate-slide-in-right max-w-5xl mx-auto w-full">
            {/* ═══ Header & Breadcrumbs ═══ */}
            <div className="mb-6 flex flex-col gap-4 border-b border-border/50 pb-5">
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setActiveSubView("items")}
                                aria-label="Back to items"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Back to items</TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                            type="button"
                            onClick={() => setActiveSubView("items")}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                        >
                            <span>{selectedCollection.icon || "📁"}</span>
                            <span className="font-medium">{selectedCollection.name}</span>
                        </button>
                        <span className="opacity-40">/</span>
                        <span className="font-semibold text-foreground">Manage Fields</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-base">
                                <Sliders className="size-4" />
                            </span>
                            Manage Custom Fields
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Define the schema and metadata structure for items in{" "}
                            <span className="font-medium text-foreground">&ldquo;{selectedCollection.name}&rdquo;</span>.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0 shadow-sm">
                        <Plus className="size-4" />
                        Add Field
                    </Button>
                </div>
            </div>

            {/* ═══ Toolbar: Search & Count ═══ */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Fields ({attributes.length})
                    </span>
                    {searchQuery && (
                        <Badge variant="secondary" className="text-[11px]">
                            {filteredAttributes.length} matching
                        </Badge>
                    )}
                </div>

                {attributes.length > 0 && (
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search fields by name or key..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 pr-8 text-xs bg-muted/20"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ Content List ═══ */}
            <div className="flex-1 overflow-y-auto pb-12">
                {attributesLoading && attributes.length === 0 ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 animate-pulse rounded-xl border border-border/50 bg-muted/20" />
                        ))}
                    </div>
                ) : attributes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed border-border/80 bg-muted/10 py-16 text-center px-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <FileText className="size-7" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="text-base font-semibold text-foreground">No custom fields yet</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Customize your collection with fields like Release Date, Rating, Director, Tags, Price, or URL to capture structured data.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="gap-1.5 mt-2"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="size-4" />
                            Create First Field
                        </Button>
                    </div>
                ) : filteredAttributes.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-8 text-center text-xs text-muted-foreground">
                        No fields match your search query &ldquo;{searchQuery}&rdquo;.
                    </div>
                ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card/60 shadow-xs overflow-hidden">
                        {filteredAttributes.map((attr) => {
                            const originalIdx = attributes.findIndex((a) => a.id === attr.id);
                            const typeMeta = getFieldTypeMeta(attr.field_type as FieldType);
                            const TypeIcon = typeMeta.icon;

                            return (
                                <div
                                    key={attr.id}
                                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30 group"
                                >
                                    {/* Left: Icon & Info */}
                                    <div className="flex min-w-0 items-center gap-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors shadow-2xs">
                                            <TypeIcon className="size-4.5" />
                                        </div>

                                        <div className="flex min-w-0 flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="truncate text-sm font-semibold text-foreground">
                                                    {attr.name}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="px-2 py-0.5 font-mono text-[10px] uppercase font-medium bg-muted/60"
                                                >
                                                    {attr.field_type}
                                                </Badge>
                                                {attr.required === 1 && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="px-1.5 py-0 text-[10px] font-medium"
                                                    >
                                                        Required
                                                    </Badge>
                                                )}
                                                {attr.searchable === 1 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1 px-1.5 py-0 text-[10px] text-muted-foreground border-border/60"
                                                    >
                                                        <Search className="size-2.5" />
                                                        Searchable
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono text-[11px] opacity-75">
                                                    key: <code className="bg-muted/60 px-1 py-0.5 rounded text-foreground/80">{attr.key}</code>
                                                </span>
                                                {attr.options && (
                                                    <>
                                                        <span className="opacity-40">•</span>
                                                        <span className="text-[11px] truncate max-w-xs">
                                                            Options: {attr.options}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex shrink-0 items-center gap-2">
                                        {/* Move reorder buttons */}
                                        {!searchQuery && (
                                            <div className="flex items-center rounded-lg border border-border/70 bg-background shadow-2xs overflow-hidden">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            disabled={originalIdx === 0}
                                                            onClick={() => handleMove(originalIdx, "up")}
                                                            className="rounded-none hover:bg-muted"
                                                        >
                                                            <ArrowUp className="size-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">Move up</TooltipContent>
                                                </Tooltip>
                                                <Separator orientation="vertical" className="h-4" />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            disabled={originalIdx === attributes.length - 1}
                                                            onClick={() => handleMove(originalIdx, "down")}
                                                            className="rounded-none hover:bg-muted"
                                                        >
                                                            <ArrowDown className="size-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">Move down</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        )}

                                        {/* Edit */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() => setEditTarget(attr)}
                                                    className="hover:border-primary/40 hover:text-foreground"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Edit field</TooltipContent>
                                        </Tooltip>

                                        {/* Delete */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() => setDeleteTarget(attr)}
                                                    className="text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Delete field</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══ Action Modals ═══ */}
            <CreateAttributeDialog
                collectionId={selectedCollection.id}
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {editTarget && (
                <EditAttributeDialog
                    attribute={editTarget}
                    open={!!editTarget}
                    onOpenChange={(open) => !open && setEditTarget(null)}
                />
            )}

            {deleteTarget && (
                <DeleteAttributeDialog
                    attribute={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                />
            )}
        </div>
    );
}

export default ManageFieldsPage;
