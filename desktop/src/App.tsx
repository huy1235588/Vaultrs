/**
 * App — Root component with global AppConfig context, collection context, item context,
 * and first-run vault directory onboarding.
 */
import { useCallback, useEffect, useRef } from "react";
import { AppConfigProvider, useAppConfig } from "@/core/context/AppConfigContext";
import { CollectionProvider, useCollections } from "@/core/context/CollectionContext";
import { ItemProvider, useItem } from "@/core/context/ItemContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initAssetResolver } from "@/core/utils/assetResolver";
import MainLayout from "@/components/Layout/MainLayout";
import HomePage from "@/pages/HomePage";
import CollectionPage from "@/pages/CollectionPage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import ManageFieldsPage from "@/pages/ManageFieldsPage";
import CollectionSettingsPage from "@/pages/CollectionSettingsPage";
import { FirstRunVaultPicker } from "@/components/Setup/FirstRunVaultPicker";
import { AppSettingsDialog } from "@/components/Settings/AppSettingsDialog";
import { Loader2 } from "lucide-react";

/**
 * Inner app content that has access to the collection and item contexts.
 */
function AppContent() {
    const { selectedCollection, activeSubView, setActiveSubView } = useCollections();
    const { selectedItem } = useItem();
    const addItemRef = useRef<(() => void) | null>(null);

    // Initialize asset resolver on mount
    useEffect(() => {
        initAssetResolver().catch(console.error);
    }, []);

    const handleAddItem = useCallback(() => {
        addItemRef.current?.();
    }, []);

    const handleOpenSettings = useCallback(() => {
        setActiveSubView("settings");
    }, [setActiveSubView]);

    // Only show "Add Item" button in header if a collection is selected AND we are in the items list view
    const showAddAction = selectedCollection && !selectedItem && activeSubView === "items";

    return (
        <MainLayout
            onAddItem={showAddAction ? handleAddItem : undefined}
            onOpenSettings={selectedCollection && !selectedItem ? handleOpenSettings : undefined}
        >
            {selectedItem ? (
                <ItemDetailPage />
            ) : selectedCollection ? (
                activeSubView === "fields" ? (
                    <ManageFieldsPage />
                ) : activeSubView === "settings" ? (
                    <CollectionSettingsPage />
                ) : (
                    <CollectionPage onAddItemRef={addItemRef} />
                )
            ) : (
                <HomePage />
            )}
        </MainLayout>
    );
}

function AppRoot() {
    const { isVaultLoaded, vaultRootPath, loading } = useAppConfig();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={300}>
            {!isVaultLoaded ? (
                <FirstRunVaultPicker />
            ) : (
                <CollectionProvider key={vaultRootPath ?? "none"}>
                    <ItemProvider key={vaultRootPath ?? "none"}>
                        <AppContent />
                    </ItemProvider>
                </CollectionProvider>
            )}
            <AppSettingsDialog />
        </TooltipProvider>
    );
}

function App() {
    return (
        <AppConfigProvider>
            <AppRoot />
        </AppConfigProvider>
    );
}

export default App;
