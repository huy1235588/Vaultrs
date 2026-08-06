/**
 * Header — Top bar showing current context, search with realtime results, and action buttons.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Plus,
    Search,
    Settings,
    ChevronRight,
    FileText,
    Loader2,
    X,
} from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useItem } from "@/core/context/ItemContext";
import { useDebounce } from "@/core/hooks/useDebounce";
import * as searchService from "@/core/api/searchService";
import type { SearchResult } from "@/core/api/searchService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AttributeManager } from "@/components/Attribute/AttributeManager";

interface HeaderProps {
    /** Called when user clicks the "Add Item" button. */
    onAddItem?: () => void;
}

const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

/** Format a unix timestamp (seconds) to a short date string. */
function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function Header({ onAddItem }: HeaderProps) {
    const { selectedCollection, collections } = useCollections();
    const { selectedItem, clearItem, selectItem } = useItem();
    const [attrManagerOpen, setAttrManagerOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(searchQuery, 250);

    // ⌘K / Ctrl+K jumps to search, matching the shortcut most desktop apps use.
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
            // Escape closes search results
            if (e.key === "Escape" && showResults) {
                setShowResults(false);
                searchRef.current?.blur();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showResults]);

    // Perform search when debounced query changes
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        let cancelled = false;
        setSearchLoading(true);

        searchService
            .quickSearch(
                debouncedQuery,
                selectedCollection?.id,
                10,
            )
            .then((results) => {
                if (!cancelled) {
                    setSearchResults(results);
                    setSearchLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Search failed:", err);
                    setSearchResults([]);
                    setSearchLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, selectedCollection?.id]);

    // Close results on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                resultsRef.current &&
                !resultsRef.current.contains(e.target as Node) &&
                searchRef.current &&
                !searchRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle clicking a search result
    const handleResultClick = useCallback(
        (result: SearchResult) => {
            selectItem(result.id);
            setShowResults(false);
            setSearchQuery("");
            searchRef.current?.blur();
        },
        [selectItem],
    );

    // Clear search
    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setShowResults(false);
        searchRef.current?.focus();
    }, []);

    // Get collection name for a result
    const getCollectionName = useCallback(
        (collectionId: number): string => {
            const col = collections.find((c) => c.id === collectionId);
            return col ? col.name : "Unknown";
        },
        [collections],
    );

    // Get collection icon for a result
    const getCollectionIcon = useCallback(
        (collectionId: number): string => {
            const col = collections.find((c) => c.id === collectionId);
            return col?.icon || "📁";
        },
        [collections],
    );

    const showManageFields = Boolean(selectedCollection && !selectedItem);
    const showAddItem = Boolean(selectedCollection && onAddItem);
    const hasActions = showManageFields || showAddItem;

    return (
        <header
            data-tauri-drag-region
            className="flex h-14 shrink-0 select-none items-center justify-between border-b border-border bg-card px-6"
        >
            {/* Left — Breadcrumb / Title */}
            <div className="flex min-w-0 items-center gap-2">
                {selectedCollection ? (
                    <div className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold tracking-tight">
                        <button
                            type="button"
                            onClick={clearItem}
                            aria-label={selectedItem ? "Back to collection" : undefined}
                            className="flex shrink-0 items-center gap-1.5 text-foreground transition-colors hover:text-primary"
                        >
                            <span className="text-base leading-none">
                                {selectedCollection.icon || "📁"}
                            </span>
                            <span>{selectedCollection.name}</span>
                        </button>

                        {selectedItem && (
                            <>
                                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium text-muted-foreground">
                                    {selectedItem.title}
                                </span>
                            </>
                        )}
                    </div>
                ) : (
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Welcome
                    </h2>
                )}
            </div>

            {/* Right — Actions */}
            <div className="flex shrink-0 items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onFocus={() => {
                            setSearchFocused(true);
                            if (searchQuery.trim()) setShowResults(true);
                        }}
                        onBlur={() => setSearchFocused(false)}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        className="h-8 w-48 bg-background pl-8 pr-12 text-sm transition-all focus-visible:w-64"
                    />
                    {/* Keyboard shortcut hint or clear button */}
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : (
                        !searchFocused && (
                            <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {isMac ? "⌘K" : "Ctrl+K"}
                            </kbd>
                        )
                    )}

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery.trim() && (
                        <div
                            ref={resultsRef}
                            className="absolute top-full right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-xl shadow-black/20"
                        >
                            {searchLoading ? (
                                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
                                    <Search className="size-5 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">
                                        No results for "{searchQuery}"
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                                        {selectedCollection && (
                                            <span> in {selectedCollection.name}</span>
                                        )}
                                    </div>
                                    {searchResults.map((result) => (
                                        <button
                                            key={result.id}
                                            type="button"
                                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent blur before click
                                                handleResultClick(result);
                                            }}
                                        >
                                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-sm">
                                                {getCollectionIcon(result.collection_id)}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {result.title}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {!selectedCollection && (
                                                        <span>{getCollectionName(result.collection_id)} · </span>
                                                    )}
                                                    {formatDate(result.updated_at)}
                                                </p>
                                            </div>
                                            <FileText className="size-3.5 shrink-0 text-muted-foreground/40" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {hasActions && <Separator orientation="vertical" className="h-5" />}

                {/* Manage Fields Button (Settings) */}
                {showManageFields && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setAttrManagerOpen(true)}
                        title="Manage Custom Fields"
                    >
                        <Settings className="size-4" />
                        Manage Fields
                    </Button>
                )}

                {/* Add Item */}
                {showAddItem && (
                    <Button size="sm" className="gap-1.5" onClick={onAddItem}>
                        <Plus className="size-4" />
                        Add Item
                    </Button>
                )}
            </div>

            {/* Attribute Manager Modal */}
            {selectedCollection && (
                <AttributeManager
                    open={attrManagerOpen}
                    onOpenChange={setAttrManagerOpen}
                />
            )}
        </header>
    );
}

export default Header;
