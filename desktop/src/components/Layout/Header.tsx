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
import { cn } from "@/lib/utils";

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
    const [activeResultIndex, setActiveResultIndex] = useState(-1);
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
                setActiveResultIndex(-1);
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
            setActiveResultIndex(-1);
            searchRef.current?.blur();
        },
        [selectItem],
    );

    // Keyboard navigation for search results
    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!showResults || searchResults.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveResultIndex((prev) =>
                    prev < searchResults.length - 1 ? prev + 1 : 0,
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveResultIndex((prev) =>
                    prev > 0 ? prev - 1 : searchResults.length - 1,
                );
            } else if (e.key === "Enter" && activeResultIndex >= 0) {
                e.preventDefault();
                handleResultClick(searchResults[activeResultIndex]);
            }
        },
        [showResults, searchResults, activeResultIndex, handleResultClick],
    );

    // Clear search
    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setShowResults(false);
        setActiveResultIndex(-1);
        searchRef.current?.focus();
    }, []);

    // Highlight matching text in search results
    const highlightMatch = useCallback(
        (text: string) => {
            if (!searchQuery.trim()) return text;
            const regex = new RegExp(
                `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                "gi",
            );
            const parts = text.split(regex);
            return parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    part
                ),
            );
        },
        [searchQuery],
    );

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
            className="relative flex h-14 shrink-0 select-none items-center justify-between border-b border-border/60 bg-card/80 px-6 backdrop-blur-sm"
        >
            {/* Left — Breadcrumb / Title */}
            <div className="flex min-w-0 items-center gap-2">
                {selectedCollection ? (
                    <div className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold tracking-tight">
                        <button
                            type="button"
                            onClick={clearItem}
                            aria-label={selectedItem ? "Back to collection" : undefined}
                            className="group/breadcrumb flex shrink-0 items-center gap-1.5 text-foreground transition-colors hover:text-primary"
                        >
                            <span className="text-base leading-none transition-transform duration-200 group-hover/breadcrumb:scale-110">
                                {selectedCollection.icon || "📁"}
                            </span>
                            <span className="relative">
                                {selectedCollection.name}
                                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-200 group-hover/breadcrumb:w-full" />
                            </span>
                        </button>

                        {selectedItem && (
                            <>
                                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
                                <span className="animate-fade-in-up truncate font-medium text-muted-foreground">
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
                    <Search className={cn(
                        "pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 transition-colors duration-200",
                        searchFocused ? "text-primary" : "text-muted-foreground"
                    )} />
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
                            setActiveResultIndex(-1);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        className={cn(
                            "h-8 w-48 bg-background/60 pl-8 pr-12 text-sm transition-all duration-300",
                            searchFocused && "w-72 bg-background shadow-sm ring-1 ring-primary/20"
                        )}
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
                            className="animate-fade-in-down absolute top-full right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl shadow-black/30 backdrop-blur-md"
                        >
                            {searchLoading ? (
                                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin text-primary" />
                                    Searching...
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted/40">
                                        <Search className="size-4 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        No results for "{searchQuery}"
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-80 overflow-y-auto">
                                    <div className="sticky top-0 z-10 border-b border-border/40 bg-card/90 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                                        {selectedCollection && (
                                            <span> in {selectedCollection.name}</span>
                                        )}
                                    </div>
                                    <div className="py-1">
                                        {searchResults.map((result, index) => (
                                            <button
                                                key={result.id}
                                                type="button"
                                                className={cn(
                                                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all duration-150",
                                                    index === activeResultIndex
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-accent/50"
                                                )}
                                                onMouseDown={(e) => {
                                                    e.preventDefault(); // Prevent blur before click
                                                    handleResultClick(result);
                                                }}
                                                onMouseEnter={() => setActiveResultIndex(index)}
                                            >
                                                <span className={cn(
                                                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors",
                                                    index === activeResultIndex ? "bg-primary/15" : "bg-muted/50"
                                                )}>
                                                    {getCollectionIcon(result.collection_id)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {highlightMatch(result.title)}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {!selectedCollection && (
                                                            <span>{getCollectionName(result.collection_id)} · </span>
                                                        )}
                                                        {formatDate(result.updated_at)}
                                                    </p>
                                                </div>
                                                <FileText className="size-3.5 shrink-0 text-muted-foreground/30" />
                                            </button>
                                        ))}
                                    </div>
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
