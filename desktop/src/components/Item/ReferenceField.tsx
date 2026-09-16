/**
 * ReferenceField — Component for selecting and displaying cross-collection item references.
 *
 * Renders a list of referenced items as interactive badges (with collection icon + title),
 * an inline search picker to add new references, and remove buttons on each badge.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GitBranch, Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import * as relationService from "@/core/api/relationService";
import { useCollections } from "@/core/context/CollectionContext";
import { useItem } from "@/core/context/ItemContext";
import type { ReferencedItem } from "@/core/types/common";
import { cn } from "@/lib/utils";

interface ReferenceFieldProps {
    /** Attribute key (property key in item JSON). */
    attributeKey: string;
    /** Target collection ID to search within. */
    targetCollectionId: number;
    /** Current value — array of item IDs. */
    value: number[] | null;
    /** Callback when references change. */
    onChange: (value: number[]) => void;
    className?: string;
}

export function ReferenceField({
    attributeKey,
    targetCollectionId,
    value,
    onChange,
    className,
}: ReferenceFieldProps) {
    const { collections } = useCollections();
    const { selectedItem } = useItem();

    const [resolvedItems, setResolvedItems] = useState<ReferencedItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Search picker state
    const [pickerOpen, setPickerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ReferencedItem[]>([]);
    const [searching, setSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedIds = Array.isArray(value) ? value : [];
    const targetCollection = collections.find((c) => c.id === targetCollectionId);

    // Resolve referenced items when value changes
    useEffect(() => {
        if (selectedIds.length === 0) {
            setResolvedItems([]);
            return;
        }

        if (!selectedItem) return;

        setLoading(true);
        relationService
            .resolveReferences(selectedItem.id, [attributeKey])
            .then((response) => {
                const items = response.references[attributeKey] ?? [];
                setResolvedItems(items);
            })
            .catch((err) => {
                console.error("Failed to resolve references:", err);
                setResolvedItems([]);
            })
            .finally(() => setLoading(false));
    }, [selectedItem?.id, attributeKey, JSON.stringify(selectedIds)]);

    // Debounced search
    useEffect(() => {
        if (!pickerOpen) return;

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            setSearching(true);
            relationService
                .searchReferenceTargets(
                    targetCollectionId,
                    searchQuery || undefined,
                    selectedIds.length > 0 ? selectedIds : undefined,
                    20,
                )
                .then(setSearchResults)
                .catch((err) => {
                    console.error("Reference search failed:", err);
                    setSearchResults([]);
                })
                .finally(() => setSearching(false));
        }, 250);

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchQuery, pickerOpen, targetCollectionId, JSON.stringify(selectedIds)]);

    // Close picker on outside click
    useEffect(() => {
        if (!pickerOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setPickerOpen(false);
                setSearchQuery("");
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [pickerOpen]);

    // Focus search input when picker opens
    useEffect(() => {
        if (pickerOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [pickerOpen]);

    const handleAddReference = useCallback(
        (item: ReferencedItem) => {
            if (selectedIds.includes(item.id)) return;
            const newIds = [...selectedIds, item.id];
            onChange(newIds);

            // Optimistically add to resolved list
            setResolvedItems((prev) => [...prev, item]);

            // Remove from search results
            setSearchResults((prev) => prev.filter((r) => r.id !== item.id));
        },
        [selectedIds, onChange],
    );

    const handleRemoveReference = useCallback(
        (itemId: number) => {
            const newIds = selectedIds.filter((id) => id !== itemId);
            onChange(newIds);
            setResolvedItems((prev) => prev.filter((item) => item.id !== itemId));
        },
        [selectedIds, onChange],
    );

    const _handleNavigateToItem = useCallback(
        (itemId: number, collectionId: number) => {
            // TODO: Navigate to the referenced item (requires context integration)
            console.log("Navigate to item:", itemId, "in collection:", collectionId);
        },
        [],
    );

    return (
        <div className={cn("space-y-2", className)}>
            {/* Referenced items list */}
            <div className="flex min-h-9 flex-wrap gap-1.5 rounded-md border bg-background/30 p-2">
                {loading ? (
                    <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" />
                        Loading references...
                    </span>
                ) : resolvedItems.length === 0 && selectedIds.length === 0 ? (
                    <span className="flex items-center gap-1.5 px-1 text-xs italic text-muted-foreground">
                        <GitBranch className="size-3" />
                        No references — click "Add" to link items
                        {targetCollection && (
                            <span>
                                from <strong>{targetCollection.name}</strong>
                            </span>
                        )}
                    </span>
                ) : (
                    resolvedItems.map((item) => (
                        <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className="group/badge cursor-default gap-1 pr-1 text-xs transition-colors"
                                >
                                    <span className="text-sm leading-none">
                                        {item.collection_icon || "📁"}
                                    </span>
                                    <span className="max-w-[140px] truncate font-medium">
                                        {item.title}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveReference(item.id);
                                        }}
                                        className="ml-0.5 rounded-full p-0.5 opacity-50 transition-all hover:bg-destructive/20 hover:text-destructive hover:opacity-100"
                                    >
                                        <X className="size-2.5" />
                                    </button>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <span className="text-xs">
                                    {item.collection_name} → {item.title}
                                </span>
                            </TooltipContent>
                        </Tooltip>
                    ))
                )}
            </div>

            {/* Add reference picker */}
            <div className="relative" ref={pickerRef}>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                        setPickerOpen(!pickerOpen);
                        if (!pickerOpen) {
                            setSearchQuery("");
                        }
                    }}
                >
                    <Search className="size-3" />
                    {pickerOpen ? "Close" : "Add reference"}
                    {targetCollection && !pickerOpen && (
                        <span className="text-muted-foreground">
                            from {targetCollection.icon || "📁"} {targetCollection.name}
                        </span>
                    )}
                </Button>

                {pickerOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                        {/* Search input */}
                        <div className="border-b p-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search in ${targetCollection?.name ?? "collection"}...`}
                                    className="h-8 pl-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-52 overflow-y-auto">
                            {searching ? (
                                <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                                    <Loader2 className="size-3 animate-spin" />
                                    Searching...
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    {searchQuery
                                        ? "No items found"
                                        : "Type to search or browse items"}
                                </div>
                            ) : (
                                searchResults.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleAddReference(item)}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                                    >
                                        <span className="text-base leading-none">
                                            {item.collection_icon || "📁"}
                                        </span>
                                        <span className="flex-1 truncate font-medium">
                                            {item.title}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
