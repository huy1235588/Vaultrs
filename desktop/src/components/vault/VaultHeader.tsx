// Vault header component

import { Folder, Plus, Settings2, Trash2 } from 'lucide-react';
import type { Vault } from '../../types';
import { Button } from '../ui/button';
import { SearchInput } from '../entry/SearchInput';

interface VaultHeaderProps {
    vault: Vault;
    entryCount: number;
    onCreateEntry?: () => void;
    onManageFields?: () => void;
    onDeleteVault?: () => void;
    // Search props
    onSearch?: (query: string) => void;
    onClearSearch?: () => void;
    isSearching?: boolean;
    searchQuery?: string;
    searchResultCount?: number;
}

export function VaultHeader({
    vault,
    entryCount,
    onCreateEntry,
    onManageFields,
    onDeleteVault,
    onSearch,
    onClearSearch,
    isSearching = false,
    searchQuery = '',
    searchResultCount = 0,
}: VaultHeaderProps) {
    const isSearchActive = searchQuery.length > 0;

    return (
        <header className="flex flex-col gap-3 p-4 border-b border-border bg-card/50">
            {/* Top row: vault info and actions */}
            <div className="flex items-center justify-between">
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
                            {isSearchActive ? (
                                <>
                                    Found {searchResultCount.toLocaleString()} {searchResultCount === 1 ? 'result' : 'results'}
                                    <span className="text-muted-foreground/60"> of {entryCount.toLocaleString()}</span>
                                </>
                            ) : (
                                <>
                                    {entryCount.toLocaleString()} {entryCount === 1 ? 'entry' : 'entries'}
                                </>
                            )}
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
            </div>

            {/* Bottom row: search input */}
            {onSearch && onClearSearch && (
                <SearchInput
                    onSearch={onSearch}
                    onClear={onClearSearch}
                    isSearching={isSearching}
                    placeholder="Search entries... (Ctrl+F)"
                    className="max-w-md"
                />
            )}
        </header>
    );
}
