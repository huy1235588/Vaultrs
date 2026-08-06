/**
 * CollectionPage — Displays the items within the selected collection
 * with toggleable List/Grid view modes.
 */
import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useLocalStorage } from "@/core/hooks/useLocalStorage";
import ItemTable from "@/components/Item/ItemTable";
import { ItemGrid } from "@/components/Item/ItemGrid";
import { ViewModeToggle } from "@/components/Item/ViewModeToggle";
import type { ViewMode } from "@/components/Item/ViewModeToggle";
import { CreateItemDialog } from "@/components/Item/CreateItemDialog";
import { EditCollectionDialog } from "@/components/Collection/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CollectionPageProps {
    /**
     * Mutable ref that the parent (App) can use to trigger opening
     * the "Create Item" dialog from the header button.
     */
    onAddItemRef?: React.MutableRefObject<(() => void) | null>;
}

function CollectionPage({ onAddItemRef }: CollectionPageProps) {
    const { selectedCollection } = useCollections();
    const [createItemOpen, setCreateItemOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
        "vaultrs-view-mode",
        "list",
    );

    // Expose the open-dialog function to the parent via ref
    useEffect(() => {
        if (onAddItemRef) {
            onAddItemRef.current = () => setCreateItemOpen(true);
            return () => {
                onAddItemRef.current = null;
            };
        }
    }, [onAddItemRef]);

    // Safety check — this page should only render when a collection is selected
    if (!selectedCollection) return null;

    return (
        <div className="flex h-full flex-col">
            {/* Collection info header */}
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-5">
                <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-2xl leading-none">
                        {selectedCollection.icon || "📁"}
                    </span>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {selectedCollection.name}
                        </h1>
                        {selectedCollection.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {selectedCollection.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <ViewModeToggle value={viewMode} onChange={setViewMode} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Collection options"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                <Pencil className="size-4" />
                                Edit collection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Delete collection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Item view — List or Grid */}
            <div className="flex-1">
                {viewMode === "grid" ? (
                    <ItemGrid
                        collectionId={selectedCollection.id}
                        refreshKey={refreshKey}
                    />
                ) : (
                    <ItemTable
                        collectionId={selectedCollection.id}
                        refreshKey={refreshKey}
                    />
                )}
            </div>

            {/* Create item dialog */}
            <CreateItemDialog
                collectionId={selectedCollection.id}
                collectionName={selectedCollection.name}
                open={createItemOpen}
                onOpenChange={setCreateItemOpen}
                onCreated={() => setRefreshKey((k) => k + 1)}
            />

            {/* Edit / delete collection dialogs */}
            <EditCollectionDialog
                collection={selectedCollection}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <DeleteCollectionDialog
                collection={selectedCollection}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </div>
    );
}

export { CollectionPage };
export default CollectionPage;
