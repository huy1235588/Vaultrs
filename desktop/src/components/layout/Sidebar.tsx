// Sidebar component showing vault list

import { useEffect } from 'react';
import { Plus, Archive } from 'lucide-react';
import { useVaultStore, VaultListItem } from '@/modules/vault';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    onCreateVault?: () => void;
}

export function Sidebar({ onCreateVault }: SidebarProps) {
    const { vaults, activeVaultId, isLoading, fetchVaults, setActiveVault } = useVaultStore();

    useEffect(() => {
        fetchVaults();
    }, [fetchVaults]);

    return (
        <aside className="w-64 h-full flex flex-col border-r border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-primary" />
                    <h1 className="font-semibold text-foreground">Vaultrs</h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCreateVault}
                    title="Create new vault"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Vault list */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-20">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : vaults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                        <Archive className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No vaults yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Create your first vault to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {vaults.map((vault) => (
                            <VaultListItem
                                key={vault.id}
                                vault={vault}
                                isActive={vault.id === activeVaultId}
                                onClick={() => setActiveVault(vault.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    {vaults.length} vault{vaults.length !== 1 ? 's' : ''}
                </p>
            </div>
        </aside>
    );
}
