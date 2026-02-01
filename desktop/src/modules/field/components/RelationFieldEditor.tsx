// RelationFieldEditor - Editor component for relation fields

import { useState, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Link2, Search, FileText } from 'lucide-react';
import { relationApi } from '../api';
import type { RelationValue, EntryPickerItem, ResolvedRelation } from '../types';

interface RelationFieldEditorProps {
    targetVaultId: number;
    value: RelationValue | null;
    onChange: (value: RelationValue | null) => void;
    disabled?: boolean;
    error?: string;
}

export function RelationFieldEditor({
    targetVaultId,
    value,
    onChange,
    disabled = false,
    error,
}: RelationFieldEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EntryPickerItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [resolvedValue, setResolvedValue] = useState<ResolvedRelation | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    // Resolve current value on mount and when value changes
    useEffect(() => {
        if (value) {
            setIsResolving(true);
            relationApi
                .resolveRelations([{ entry_id: value.entry_id, vault_id: value.vault_id }])
                .then((resolved) => {
                    const key = relationApi.createRelationKey(value.entry_id, value.vault_id);
                    setResolvedValue(resolved[key] || null);
                })
                .catch((err) => {
                    console.error('Failed to resolve relation:', err);
                    setResolvedValue(null);
                })
                .finally(() => setIsResolving(false));
        } else {
            setResolvedValue(null);
        }
    }, [value]);

    // Debounced search
    const debouncedSearch = useDebouncedCallback(
        useCallback(
            async (searchQuery: string) => {
                if (!targetVaultId) return;

                setIsSearching(true);
                try {
                    const items = await relationApi.searchEntriesForPicker(
                        targetVaultId,
                        searchQuery,
                        20
                    );
                    setResults(items);
                } catch (err) {
                    console.error('Failed to search entries:', err);
                    setResults([]);
                } finally {
                    setIsSearching(false);
                }
            },
            [targetVaultId]
        ),
        300
    );

    // Load initial results when popover opens
    useEffect(() => {
        if (isOpen && results.length === 0) {
            debouncedSearch('');
        }
    }, [isOpen, results.length, debouncedSearch]);

    const handleSelect = (item: EntryPickerItem) => {
        onChange({
            entry_id: item.id,
            vault_id: item.vault_id,
        });
        setIsOpen(false);
        setQuery('');
    };

    const handleClear = () => {
        onChange(null);
        setResolvedValue(null);
    };

    const handleQueryChange = (newQuery: string) => {
        setQuery(newQuery);
        debouncedSearch(newQuery);
    };

    // Display for selected value
    const renderSelectedValue = () => {
        if (isResolving) {
            return <Skeleton className="h-5 w-32" />;
        }

        if (resolvedValue) {
            if (!resolvedValue.exists) {
                return (
                    <span className="text-muted-foreground line-through">
                        [Deleted Entry]
                    </span>
                );
            }
            return (
                <div className="flex items-center gap-2 truncate">
                    {resolvedValue.coverImagePath ? (
                        <img
                            src={resolvedValue.coverImagePath}
                            alt=""
                            className="h-5 w-5 rounded object-cover"
                        />
                    ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{resolvedValue.title}</span>
                </div>
            );
        }

        return (
            <span className="text-muted-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Select entry...
            </span>
        );
    };

    return (
        <div className="flex gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={`flex-1 justify-start font-normal ${error ? 'border-destructive' : ''}`}
                        disabled={disabled}
                    >
                        {renderSelectedValue()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search entries..."
                            value={query}
                            onValueChange={handleQueryChange}
                        />
                        <CommandList>
                            {isSearching ? (
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : results.length === 0 ? (
                                <CommandEmpty>
                                    <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                                        <Search className="h-8 w-8" />
                                        <span>No entries found</span>
                                    </div>
                                </CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {results.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={String(item.id)}
                                            onSelect={() => handleSelect(item)}
                                            className="flex items-center gap-3 cursor-pointer"
                                        >
                                            {item.thumbnail ? (
                                                <img
                                                    src={item.thumbnail}
                                                    alt=""
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {item.title}
                                                </div>
                                                {item.subtitle && (
                                                    <div className="text-sm text-muted-foreground truncate">
                                                        {item.subtitle}
                                                    </div>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    disabled={disabled}
                    className="shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
