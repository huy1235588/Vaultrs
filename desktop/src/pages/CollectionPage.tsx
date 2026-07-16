/**
 * CollectionPage — Displays the items within the selected collection.
 */
import { useEffect, useState } from "react";
import { useCollections } from "@/core/context/CollectionContext";
import ItemTable from "@/components/Item/ItemTable";
import { CreateItemDialog } from "@/components/Item/CreateItemDialog";

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
    const [refreshKey, setRefreshKey] = useState(0);

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
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">
                        {selectedCollection.icon || "📁"}
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {selectedCollection.name}
                        </h1>
                        {selectedCollection.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {selectedCollection.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Item table */}
            <div className="flex-1">
                <ItemTable
                    collectionId={selectedCollection.id}
                    refreshKey={refreshKey}
                />
            </div>

            {/* Create item dialog */}
            <CreateItemDialog
                collectionId={selectedCollection.id}
                collectionName={selectedCollection.name}
                open={createItemOpen}
                onOpenChange={setCreateItemOpen}
                onCreated={() => setRefreshKey((k) => k + 1)}
            />
        </div>
    );
}

export { CollectionPage };
export default CollectionPage;
