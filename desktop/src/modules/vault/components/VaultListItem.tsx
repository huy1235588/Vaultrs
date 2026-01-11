// Vault list item component

import { Folder } from 'lucide-react';
import type { Vault } from '../types';
import { cn } from '@/lib/utils';

interface VaultListItemProps {
    vault: Vault;
    isActive: boolean;
    onClick: () => void;
}

export function VaultListItem({ vault, isActive, onClick }: VaultListItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground'
            )}
        >
            <div
                className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                style={{
                    backgroundColor: vault.color
                        ? `${vault.color}20`
                        : 'hsl(var(--primary) / 0.1)',
                }}
            >
                <Folder
                    className="h-4 w-4"
                    style={{ color: vault.color || 'hsl(var(--primary))' }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{vault.name}</p>
                {vault.description && (
                    <p className="text-xs text-muted-foreground truncate">
                        {vault.description}
                    </p>
                )}
            </div>
        </button>
    );
}
