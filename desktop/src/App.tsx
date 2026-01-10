// Main App component

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { MainLayout } from './components/layout';
import { CreateVaultDialog, VaultHeader } from './components/vault';
import { EntryList, CreateEntryDialog } from './components/entry';
import { FieldDefinitionManager } from './components/field';
import { useVaultStore, useEntryStore } from './stores';
import './App.css';

function App() {
    const [showCreateVault, setShowCreateVault] = useState(false);
    const [showCreateEntry, setShowCreateEntry] = useState(false);
    const [showFieldManager, setShowFieldManager] = useState(false);

    const { activeVaultId, vaults, deleteVault } = useVaultStore();
    const { total } = useEntryStore();

    const activeVault = vaults.find((v) => v.id === activeVaultId) ?? null;

    const handleDeleteVault = async () => {
        if (!activeVault) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${activeVault.name}"? This will also delete all entries in this vault.`
        );

        if (confirmed) {
            await deleteVault(activeVault.id);
        }
    };

    return (
        <>
            <MainLayout onCreateVault={() => setShowCreateVault(true)}>
                {activeVault ? (
                    <>
                        <VaultHeader
                            vault={activeVault}
                            entryCount={total}
                            onCreateEntry={() => setShowCreateEntry(true)}
                            onManageFields={() => setShowFieldManager(true)}
                            onDeleteVault={handleDeleteVault}
                        />
                        <EntryList vaultId={activeVault.id} />
                    </>
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

            {/* Dialogs */}
            <CreateVaultDialog
                open={showCreateVault}
                onClose={() => setShowCreateVault(false)}
            />

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
        </>
    );
}

export default App;
