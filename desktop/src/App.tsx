// Main App component - redesigned with three-panel layout

import { useCallback } from 'react';
import { Archive } from 'lucide-react';
import { MainLayout } from './components/layout';
import { CreateVaultDialog } from '@/modules/vault';
import { EntryList } from '@/modules/entry';
import { EntryGridView } from '@/modules/entry/components/EntryGridView';
import { CreateEntryDialog } from '@/modules/entry';
import { FieldDefinitionManager } from '@/modules/field';
import { CommandPalette } from '@/components/CommandPalette';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useVaultStore } from '@/modules/vault';
import { useUIStore } from '@/stores/uiStore';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

function App() {
    // Global keyboard shortcuts
    useGlobalShortcuts();

    const { activeVaultId, vaults, deleteVault } = useVaultStore();
    const {
        viewMode,
        showCreateVault,
        setShowCreateVault,
        showCreateEntry,
        setShowCreateEntry,
        showFieldManager,
        setShowFieldManager,
        showDeleteVault,
        setShowDeleteVault,
        setSelectedEntryId,
        setDetailPanelOpen,
    } = useUIStore();

    const activeVault = vaults.find((v) => v.id === activeVaultId) ?? null;

    const handleDeleteVault = useCallback(async () => {
        if (!activeVault) return;
        await deleteVault(activeVault.id);
        setShowDeleteVault(false);
        setSelectedEntryId(null);
        setDetailPanelOpen(false);
    }, [activeVault, deleteVault, setShowDeleteVault, setSelectedEntryId, setDetailPanelOpen]);

    return (
        <>
            <MainLayout>
                {activeVault ? (
                    viewMode === 'grid' ? (
                        <EntryGridView vaultId={activeVault.id} />
                    ) : (
                        <EntryList vaultId={activeVault.id} />
                    )
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Archive className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Welcome to Vaultrs</h2>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Your personal media vault for managing large collections.
                            Select a vault from the sidebar or create a new one to get started.
                        </p>
                        <button
                            onClick={() => setShowCreateVault(true)}
                            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                        >
                            Create Your First Vault
                        </button>
                    </div>
                )}
            </MainLayout>

            {/* Command Palette */}
            <CommandPalette />

            {/* Create Vault Dialog */}
            <CreateVaultDialog
                open={showCreateVault}
                onClose={() => setShowCreateVault(false)}
            />

            {/* Create Entry Dialog */}
            {activeVault && (
                <>
                    <CreateEntryDialog
                        open={showCreateEntry}
                        vaultId={activeVault.id}
                        onClose={() => setShowCreateEntry(false)}
                    />
                    <FieldDefinitionManager
                        vaultId={activeVault.id}
                        vaultName={activeVault.name}
                        isOpen={showFieldManager}
                        onClose={() => setShowFieldManager(false)}
                    />
                </>
            )}

            {/* Delete Vault Confirmation */}
            <AlertDialog open={showDeleteVault} onOpenChange={setShowDeleteVault}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vault</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{activeVault?.name}&quot;?
                            This will also delete all entries in this vault. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVault}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Vault
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default App;
