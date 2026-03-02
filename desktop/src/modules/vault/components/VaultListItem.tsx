// Vault list item component with collapsed mode support

import { Folder } from 'lucide-react';
import type { Vault } from '../types';
import { cn } from '@/lib/utils';

interface VaultListItemProps {
    vault: Vault;
    isActive: boolean;
    onClick: () => void;
    collapsed?: boolean;
}

export function VaultListItem({ vault, isActive, onClick, collapsed = false }: VaultListItemProps) {
    if (collapsed) {
        return (
            <button
                onClick={onClick}
                title={vault.name}
                className={cn(
                    'w-full flex items-center justify-center p-1.5 rounded-lg transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-sidebar-accent ring-1 ring-sidebar-primary'
                )}
            >
                <div
                    className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                    style={{
                        backgroundColor: vault.color
                            ? `${vault.color}20`
                            : 'hsl(var(--primary) / 0.1)',
                    }}
                >
                    <Folder
                        className="h-3.5 w-3.5"
                        style={{ color: vault.color || 'hsl(var(--primary))' }}
                    />
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 py-2 rounded-lg text-left transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'border-l-2 pl-[10px] pr-3',
                isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-primary'
                    : 'border-transparent'
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
