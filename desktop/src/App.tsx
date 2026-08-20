/**
 * App — Root component with collection context, item context, and conditional routing.
 *
 * Renders HomePage when no collection is selected, CollectionPage when a collection
 * is active, and ItemDetailPage when a specific item is selected.
 */
import { useCallback, useEffect, useRef } from "react";
import { CollectionProvider, useCollections } from "@/core/context/CollectionContext";
import { ItemProvider, useItem } from "@/core/context/ItemContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initAssetResolver } from "@/core/utils/assetResolver";
import MainLayout from "@/components/Layout/MainLayout";
import HomePage from "@/pages/HomePage";
import CollectionPage from "@/pages/CollectionPage";
import ItemDetailPage from "@/pages/ItemDetailPage";

/**
 * Inner app content that has access to the collection and item contexts.
 */
function AppContent() {
    const { selectedCollection } = useCollections();
    const { selectedItem } = useItem();
    const addItemRef = useRef<(() => void) | null>(null);
    const openSettingsRef = useRef<(() => void) | null>(null);

    // Initialize asset resolver on mount
    useEffect(() => {
        initAssetResolver().catch(console.error);
    }, []);

    const handleAddItem = useCallback(() => {
        addItemRef.current?.();
    }, []);

    const handleOpenSettings = useCallback(() => {
        openSettingsRef.current?.();
    }, []);

    // Only show "Add Item" button in header if a collection is selected AND we are NOT in item detail view
    const showAddAction = selectedCollection && !selectedItem;

    return (
        <MainLayout
            onAddItem={showAddAction ? handleAddItem : undefined}
            onOpenSettings={selectedCollection && !selectedItem ? handleOpenSettings : undefined}
        >
            {selectedItem ? (
                <ItemDetailPage />
            ) : selectedCollection ? (
                <CollectionPage
                    onAddItemRef={addItemRef}
                    onOpenSettingsRef={openSettingsRef}
                />
            ) : (
                <HomePage />
            )}
        </MainLayout>
    );
}

function App() {
    return (
        <CollectionProvider>
            <ItemProvider>
                <TooltipProvider delayDuration={300}>
                    <AppContent />
                </TooltipProvider>
            </ItemProvider>
        </CollectionProvider>
    );
}

export default App;

