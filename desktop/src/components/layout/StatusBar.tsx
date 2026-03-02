// StatusBar component showing vault context info and keyboard shortcuts

import { Archive, Database, Keyboard } from 'lucide-react';
import { useVaultStore } from '@/modules/vault';
import { useEntryStore } from '@/modules/entry';

export function StatusBar() {
    const activeVault = useVaultStore((s) => {
        const vault = s.vaults.find((v) => v.id === s.activeVaultId);
        return vault ?? null;
    });
    const { total, searchQuery, searchTotal } = useEntryStore();

    const displayCount = searchQuery ? searchTotal : total;
    const label = searchQuery ? 'results' : 'entries';

    return (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card/50 text-xs text-muted-foreground select-none">
            {/* Left: vault context */}
            <div className="flex items-center gap-3">
                {activeVault ? (
                    <>
                        <span className="flex items-center gap-1.5">
                            <Archive className="h-3 w-3" />
                            {activeVault.name}
                        </span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1.5">
                            <Database className="h-3 w-3" />
                            {displayCount} {label}
                        </span>
                        {searchQuery && (
                            <>
                                <span className="text-border">|</span>
                                <span className="text-primary/70">
                                    Searching: &quot;{searchQuery}&quot;
                                </span>
                            </>
                        )}
                    </>
                ) : (
                    <span>No vault selected</span>
                )}
            </div>

            {/* Right: keyboard shortcut hints */}
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                    <Keyboard className="h-3 w-3" />
                    <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Ctrl+K</kbd>
                    <span>Command</span>
                </span>
                {activeVault && (
                    <>
                        <span className="flex items-center gap-1.5">
                            <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Ctrl+N</kbd>
                            <span>New Entry</span>
                        </span>
                        {searchQuery ? (
                            <span className="flex items-center gap-1.5">
                                <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Esc</kbd>
                                <span>Clear search</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Ctrl+F</kbd>
                                <span>Search</span>
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
