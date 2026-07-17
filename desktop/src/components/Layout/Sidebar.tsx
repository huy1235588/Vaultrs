/**
 * Sidebar — Navigation sidebar showing the collection list and management controls.
 */
import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Database, Settings } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateCollectionDialog } from "@/components/Collection/CreateCollectionDialog";
import { EditCollectionDialog } from "@/components/Collection/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import { AttributeManager } from "@/components/Attribute/AttributeManager";
import type { Collection } from "@/core/types/common";


function Sidebar() {
    const { collections, selectedCollection, selectCollection, loading } =
        useCollections();

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Collection | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
    const [contextMenuId, setContextMenuId] = useState<number | null>(null);
    const [attrManagerOpen, setAttrManagerOpen] = useState(false);


    return (
        <aside className="flex w-64 flex-col border-r border-border bg-card">
            {/* Logo */}
            <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                <img
                    className="h-12"
                    src="/logo-1.png"
                    alt="Vaultrs"
                    loading="eager"
                />
            </div>

            {/* Collection list */}
            <nav className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Collections
                    </p>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setCreateOpen(true)}
                        title="New Collection"
                    >
                        <Plus className="size-3.5" />
                    </Button>
                </div>

                <div className="space-y-0.5">
                    {loading ? (
                        <div className="space-y-1.5 px-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-8 animate-pulse rounded-md bg-muted"
                                />
                            ))}
                        </div>
                    ) : collections.length === 0 ? (
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                        >
                            <Database className="size-4 opacity-50" />
                            <span>Create your first collection</span>
                        </button>
                    ) : (
                        collections.map((collection) => (
                            <div
                                key={collection.id}
                                className="group relative"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        selectCollection(collection.id)
                                    }
                                    className={cn(
                                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                                        selectedCollection?.id ===
                                            collection.id
                                            ? "bg-primary/15 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                    )}
                                >
                                    <span className="shrink-0 text-base leading-none">
                                        {collection.icon || "📁"}
                                    </span>
                                    <span className="truncate">
                                        {collection.name}
                                    </span>
                                </button>

                                {/* Actions menu toggle */}
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className={cn(
                                        "absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",
                                        contextMenuId === collection.id &&
                                            "opacity-100",
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setContextMenuId(
                                            contextMenuId === collection.id
                                                ? null
                                                : collection.id,
                                        );
                                    }}
                                >
                                    <MoreHorizontal className="size-3.5" />
                                </Button>

                                {/* Dropdown menu */}
                                {contextMenuId === collection.id && (
                                    <div className="absolute top-full right-1.5 z-50 mt-1 w-36 rounded-md border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditTarget(collection);
                                                setContextMenuId(null);
                                            }}
                                        >
                                            <Pencil className="size-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectCollection(collection.id);
                                                setAttrManagerOpen(true);
                                                setContextMenuId(null);
                                            }}
                                        >
                                            <Settings className="size-3.5" />
                                            Manage Fields
                                        </button>
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(collection);
                                                setContextMenuId(null);
                                            }}
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </nav>

            {/* Dialogs */}
            <CreateCollectionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {editTarget && (
                <EditCollectionDialog
                    collection={editTarget}
                    open={!!editTarget}
                    onOpenChange={(open) => !open && setEditTarget(null)}
                />
            )}

            {deleteTarget && (
                <DeleteCollectionDialog
                    collection={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                />
            )}

            {/* Attribute Manager */}
            {selectedCollection && (
                <AttributeManager
                    open={attrManagerOpen}
                    onOpenChange={setAttrManagerOpen}
                />
            )}
        </aside>
    );
}

export default Sidebar;
