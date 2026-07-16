/**
 * App — Root component with collection context and conditional routing.
 *
 * Renders HomePage when no collection is selected, or CollectionPage
 * when a collection is active. Wraps everything in CollectionProvider.
 */
import { useCallback, useRef } from "react";
import { CollectionProvider, useCollections } from "@/core/context/CollectionContext";
import MainLayout from "@/components/Layout/MainLayout";
import HomePage from "@/pages/HomePage";
import CollectionPage from "@/pages/CollectionPage";

/**
 * Inner app content that has access to the collection context.
 */
function AppContent() {
    const { selectedCollection } = useCollections();
    const addItemRef = useRef<(() => void) | null>(null);

    const handleAddItem = useCallback(() => {
        addItemRef.current?.();
    }, []);

    return (
        <MainLayout onAddItem={selectedCollection ? handleAddItem : undefined}>
            {selectedCollection ? (
                <CollectionPage onAddItemRef={addItemRef} />
            ) : (
                <HomePage />
            )}
        </MainLayout>
    );
}

function App() {
    return (
        <CollectionProvider>
            <AppContent />
        </CollectionProvider>
    );
}

export default App;
