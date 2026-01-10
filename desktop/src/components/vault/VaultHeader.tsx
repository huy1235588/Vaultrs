// Vault header component

import { Folder, Plus, Settings2, Trash2 } from 'lucide-react';
import type { Vault } from '../../types';
import { Button } from '../ui/button';

interface VaultHeaderProps {
    vault: Vault;
    entryCount: number;
    onCreateEntry?: () => void;
    onManageFields?: () => void;
    onDeleteVault?: () => void;
}

export function VaultHeader({
    vault,
    entryCount,
    onCreateEntry,
    onManageFields,
    onDeleteVault,
}: VaultHeaderProps) {
    return (
        <header className="flex items-center justify-between p-4 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                        backgroundColor: vault.color
                            ? `${vault.color}20`
                            : 'hsl(var(--primary) / 0.1)',
                    }}
                >
                    <Folder
                        className="h-5 w-5"
                        style={{ color: vault.color || 'hsl(var(--primary))' }}
                    />
                </div>
                <div>
                    <h2 className="font-semibold text-lg">{vault.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {entryCount.toLocaleString()} {entryCount === 1 ? 'entry' : 'entries'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={onCreateEntry}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Entry
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onManageFields}
                    title="Manage custom fields"
                >
                    <Settings2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDeleteVault}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete vault"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
