// Collapsible sidebar component showing vault list

import { useEffect } from 'react';
import { Plus, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVaultStore, VaultListItem } from '@/modules/vault';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const { vaults, activeVaultId, isLoading, fetchVaults, setActiveVault } = useVaultStore();
    const { sidebarCollapsed, toggleSidebar, setShowCreateVault } = useUIStore();

    useEffect(() => {
        fetchVaults();
    }, [fetchVaults]);

    return (
        <aside
            className={cn(
                'h-full flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out',
                sidebarCollapsed ? 'w-12' : 'w-64'
            )}
        >
            {/* Header */}
            <div className={cn(
                'flex items-center border-b border-sidebar-border',
                sidebarCollapsed ? 'flex-col gap-1 p-2' : 'justify-between p-4'
            )}>
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <Archive className="h-5 w-5 text-sidebar-primary" />
                        <h1 className="font-semibold text-sidebar-foreground">Vaultrs</h1>
                    </div>
                )}

                <div className={cn(
                    'flex items-center',
                    sidebarCollapsed ? 'flex-col gap-1' : 'gap-1'
                )}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowCreateVault(true)}
                        title="Create new vault"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Vault list */}
            <div className={cn(
                'flex-1 overflow-y-auto',
                sidebarCollapsed ? 'p-1' : 'p-2'
            )}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-20">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : vaults.length === 0 ? (
                    <div className={cn(
                        'flex flex-col items-center justify-center text-center',
                        sidebarCollapsed ? 'h-20 p-1' : 'h-40 p-4'
                    )}>
                        {!sidebarCollapsed && (
                            <>
                                <Archive className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No vaults yet</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Create your first vault to get started
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {vaults.map((vault) => (
                            <VaultListItem
                                key={vault.id}
                                vault={vault}
                                isActive={vault.id === activeVaultId}
                                onClick={() => setActiveVault(vault.id)}
                                collapsed={sidebarCollapsed}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={cn(
                'border-t border-sidebar-border',
                sidebarCollapsed ? 'p-1' : 'p-2'
            )}>
                <ThemeToggle collapsed={sidebarCollapsed} />
                {!sidebarCollapsed && (
                    <p className="text-xs text-muted-foreground text-center mt-2 pb-1">
                        {vaults.length} vault{vaults.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </aside>
    );
}
